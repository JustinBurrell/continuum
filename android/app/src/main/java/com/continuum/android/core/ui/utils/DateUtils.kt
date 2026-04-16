package com.continuum.android.core.ui.utils

import java.text.SimpleDateFormat
import java.util.Locale

fun String.toDisplayDate(): String {
    return try {
        val input = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(this.take(10)) ?: return this.take(10)
        SimpleDateFormat("MM-dd-yyyy", Locale.US).format(input)
    } catch (_: Exception) {
        this.take(10)
    }
}
