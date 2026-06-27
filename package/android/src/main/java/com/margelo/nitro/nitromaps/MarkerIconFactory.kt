package com.margelo.nitro.nitromaps

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.util.LruCache
import com.google.android.gms.maps.model.BitmapDescriptor
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.Marker
import java.net.URL
import java.util.WeakHashMap
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/** Builds and caches marker icons from bundled assets or remote URLs. */
internal class MarkerIconFactory(
  private val context: Context,
  private val density: Float,
  private val markerRegistry: () -> Map<String, Marker>,
) {
  private val cache = object : LruCache<String, BitmapDescriptor>(64) {}
  private val sizeCache = object : LruCache<String, Pair<Float, Float>>(64) {}
  private val mainHandler = Handler(Looper.getMainLooper())
  private val appliedIconKeys = WeakHashMap<Marker, String>()
  private val pendingIconKeys = WeakHashMap<Marker, String>()

  fun applyVisualProps(
    descriptor: MarkerDescriptor,
    marker: Marker,
    key: String,
  ) {
    applyAnchor(descriptor, marker)
    marker.rotation = descriptor.rotation?.toFloat() ?: 0f
    marker.isFlat = descriptor.flat == true
    marker.alpha = descriptor.opacity?.toFloat() ?: 1f

    applyIcon(
      marker = marker,
      image = descriptor.image,
      isMarkerActive = { isMarkerCurrent(key, marker) },
      onIconApplied = { applyAnchor(descriptor, marker) },
    )
  }

  private fun applyAnchor(descriptor: MarkerDescriptor, marker: Marker) {
    val size = if (descriptor.image != null) {
      displaySizePx(descriptor.image) ?: (0f to 0f)
    } else {
      defaultMarkerDisplaySizePx()
    }
    val (anchorX, anchorY) = descriptor.effectiveGoogleMapsAnchor(size.first, size.second)
    marker.setAnchor(anchorX, anchorY)
  }

  private fun isMarkerCurrent(key: String, marker: Marker): Boolean =
    markerRegistry()[key] === marker

  private fun applyIcon(
    marker: Marker,
    image: MarkerImage?,
    isMarkerActive: () -> Boolean,
    onIconApplied: () -> Unit,
  ) {
    if (image == null) {
      if (isIconKeyCurrent(marker, DEFAULT_ICON_KEY)) {
        return
      }
      marker.setIcon(BitmapDescriptorFactory.defaultMarker())
      setApplied(marker, DEFAULT_ICON_KEY)
      onIconApplied()
      return
    }

    val iconKey = cacheKey(image)
    if (isIconKeyCurrent(marker, iconKey)) {
      return
    }

    icon(image)?.let { cached ->
      marker.setIcon(cached)
      setApplied(marker, iconKey)
      onIconApplied()
      return
    }

    setPending(marker, iconKey)
    loadIconAsync(image) { loaded ->
      if (loaded != null && isMarkerActive() && isIconKeyCurrent(marker, iconKey)) {
        marker.setIcon(loaded)
        setApplied(marker, iconKey)
        onIconApplied()
      }
    }
  }

  fun displaySizePx(image: MarkerImage): Pair<Float, Float>? {
    val key = cacheKey(image)
    sizeCache.get(key)?.let { return it }

    val widthDp = image.width
    val heightDp = image.height
    if (widthDp != null && heightDp != null) {
      val size = (widthDp * density).toFloat() to (heightDp * density).toFloat()
      sizeCache.put(key, size)
      return size
    }

    val bitmap = loadLocalBitmap(image) ?: return null
    val size = bitmap.width.toFloat() to bitmap.height.toFloat()
    sizeCache.put(key, size)
    return size
  }

  fun defaultMarkerDisplaySizePx(): Pair<Float, Float> =
    (DEFAULT_MARKER_WIDTH_DP * density) to (DEFAULT_MARKER_HEIGHT_DP * density)

  fun cacheKey(image: MarkerImage): String {
    return "${image.uri}|${image.width ?: ""}|${image.height ?: ""}|${image.scale ?: ""}"
  }

  fun icon(image: MarkerImage): BitmapDescriptor? {
    val key = cacheKey(image)
    cache.get(key)?.let { return it }

    val bitmap = loadLocalBitmap(image) ?: return null
    return cacheBitmap(key, bitmap)
  }

  fun loadIconAsync(
    image: MarkerImage,
    onLoaded: (BitmapDescriptor?) -> Unit,
  ) {
    val key = cacheKey(image)
    cache.get(key)?.let {
      deliverOnMainThread { onLoaded(it) }
      return
    }

    if (image.uri.startsWith("http://") || image.uri.startsWith("https://")) {
      loadExecutor.execute {
        val descriptor = loadRemoteIcon(image, key)
        deliverOnMainThread { onLoaded(descriptor) }
      }
      return
    }

    deliverOnMainThread { onLoaded(icon(image)) }
  }

  private fun isIconKeyCurrent(marker: Marker, key: String): Boolean =
    appliedIconKeys[marker] == key || pendingIconKeys[marker] == key

  private fun setApplied(marker: Marker, key: String) {
    appliedIconKeys[marker] = key
    pendingIconKeys.remove(marker)
  }

  private fun setPending(marker: Marker, key: String) {
    pendingIconKeys[marker] = key
  }

  private fun deliverOnMainThread(block: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      block()
    } else {
      mainHandler.post(block)
    }
  }

  private fun loadRemoteIcon(image: MarkerImage, key: String): BitmapDescriptor? {
    return try {
      val connection = URL(image.uri).openConnection()
      connection.connectTimeout = 10_000
      connection.readTimeout = 10_000
      connection.getInputStream().use { stream ->
        val decoded = BitmapFactory.decodeStream(stream) ?: return null
        cacheBitmap(key, resizeBitmap(decoded, image))
      }
    } catch (error: Exception) {
      Log.w(TAG, "Failed to load marker image: ${image.uri}", error)
      null
    }
  }

  private fun loadLocalBitmap(image: MarkerImage): Bitmap? {
    val uri = image.uri

    if (uri.startsWith("file://")) {
      val path = uri.removePrefix("file://")
      return decodeFile(path, image)
    }

    if (uri.startsWith("/")) {
      return decodeFile(uri, image)
    }

    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return null
    }

    val resourceName = uri.substringAfterLast('/').substringBeforeLast('.')
    val resourceId = context.resources.getIdentifier(resourceName, "drawable", context.packageName)
    if (resourceId != 0) {
      return decodeResource(resourceId, image)
    }

    return try {
      context.assets.open(uri).use { stream ->
        val decoded = BitmapFactory.decodeStream(stream) ?: return null
        resizeBitmap(decoded, image)
      }
    } catch (_: Exception) {
      null
    }
  }

  private fun decodeFile(path: String, image: MarkerImage): Bitmap? {
    val decoded = BitmapFactory.decodeFile(path) ?: return null
    return resizeBitmap(decoded, image)
  }

  private fun decodeResource(resourceId: Int, image: MarkerImage): Bitmap? {
    val decoded = BitmapFactory.decodeResource(context.resources, resourceId) ?: return null
    return resizeBitmap(decoded, image)
  }

  private fun cacheBitmap(key: String, bitmap: Bitmap): BitmapDescriptor {
    val descriptor = BitmapDescriptorFactory.fromBitmap(bitmap)
    cache.put(key, descriptor)
    sizeCache.put(key, bitmap.width.toFloat() to bitmap.height.toFloat())
    return descriptor
  }

  private fun resizeBitmap(source: Bitmap, image: MarkerImage): Bitmap {
    val width = image.width ?: return source
    val height = image.height ?: return source
    // width/height are dp; scale is asset metadata only (@2x/@3x), not a display multiplier.
    val targetWidth = (width * density).toInt().coerceAtLeast(1)
    val targetHeight = (height * density).toInt().coerceAtLeast(1)

    if (source.width == targetWidth && source.height == targetHeight) {
      return source
    }

    return Bitmap.createScaledBitmap(source, targetWidth, targetHeight, true)
  }

  private companion object {
    const val TAG = "NitroMaps"
    const val DEFAULT_ICON_KEY = "__default__"
    private const val DEFAULT_MARKER_WIDTH_DP = 40f
    private const val DEFAULT_MARKER_HEIGHT_DP = 52f

    private val loadExecutor: ExecutorService = Executors.newSingleThreadExecutor()
  }
}
