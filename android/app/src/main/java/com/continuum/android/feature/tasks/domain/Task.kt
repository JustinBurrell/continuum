package com.continuum.android.feature.tasks.domain

data class Task(
    val id: String,
    val title: String,
    val description: String,
    val status: String,         // "todo" | "in_progress" | "completed"
    val priority: String?,      // "low" | "medium" | "high"
    val type: String?,
    val dueDate: String?,
    val duration: Int?,
    val isShared: Boolean,
    val updatedAt: String
) {
    val isOverdue: Boolean
        get() = dueDate != null && try {
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
            sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val due = sdf.parse(dueDate!!)
            due != null && due.before(java.util.Date()) && status != "completed"
        } catch (_: Exception) { false }

    val dueDateShort: String?
        get() = dueDate?.take(10) // "yyyy-MM-dd"
}
