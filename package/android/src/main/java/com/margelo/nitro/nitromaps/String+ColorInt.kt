package com.margelo.nitro.nitromaps

import android.graphics.Color

/** Parses a hex color string into an Android color int. */
fun String.toColorInt(fallback: Int = Color.BLACK): Int {
  val trimmed = trim()
  if (trimmed.isEmpty()) {
    return fallback
  }

  return try {
    Color.parseColor(trimmed)
  } catch (_: IllegalArgumentException) {
    fallback
  }
}
