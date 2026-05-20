package com.continuum.android.core.ui.utils

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

fun String.toDisplayDate(): String {
    return try {
        val input = SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(this.take(10)) ?: return this.take(10)
        SimpleDateFormat("MM-dd-yyyy", Locale.US).format(input)
    } catch (_: Exception) {
        this.take(10)
    }
}

fun String.toNotificationTime(): String {
    return try {
        val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }.parse(this) ?: return this.take(10)
        val cal = Calendar.getInstance().apply { time = iso }
        val now = Calendar.getInstance()
        val isToday = cal.get(Calendar.YEAR) == now.get(Calendar.YEAR) &&
                cal.get(Calendar.DAY_OF_YEAR) == now.get(Calendar.DAY_OF_YEAR)
        if (isToday) {
            SimpleDateFormat("h:mm a", Locale.US).format(iso)
        } else {
            SimpleDateFormat("MMM d", Locale.US).format(iso)
        }
    } catch (_: Exception) {
        this.take(10)
    }
}

fun notificationTimeGroup(isoDate: String): String {
    return try {
        val iso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = java.util.TimeZone.getTimeZone("UTC")
        }.parse(isoDate) ?: return "Earlier"
        val cal = Calendar.getInstance().apply { time = iso }
        val now = Calendar.getInstance()
        val sameYear = cal.get(Calendar.YEAR) == now.get(Calendar.YEAR)
        val sameDay = sameYear && cal.get(Calendar.DAY_OF_YEAR) == now.get(Calendar.DAY_OF_YEAR)
        val sameWeek = sameYear && cal.get(Calendar.WEEK_OF_YEAR) == now.get(Calendar.WEEK_OF_YEAR)
        val sameMonth = sameYear && cal.get(Calendar.MONTH) == now.get(Calendar.MONTH)
        when {
            sameDay -> "Today"
            sameWeek -> "This week"
            sameMonth -> "This month"
            else -> "Earlier"
        }
    } catch (_: Exception) {
        "Earlier"
    }
}
