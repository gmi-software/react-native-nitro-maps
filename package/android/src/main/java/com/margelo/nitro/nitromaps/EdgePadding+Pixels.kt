package com.margelo.nitro.nitromaps

import kotlin.math.max

fun EdgePadding?.toPaddingPixels(): Int {
  if (this == null) {
    return 0
  }

  return max(max(top, right), max(bottom, left)).toInt()
}

fun EdgePadding.toPaddingInsets(): IntArray {
  return intArrayOf(
    left.toInt(),
    top.toInt(),
    right.toInt(),
    bottom.toInt(),
  )
}
