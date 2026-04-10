package com.continuum.android.feature.tasks.domain

data class TaskParticipant(
    val userId: String,
    val status: String,
    val completedAt: String? = null
)

data class Task(
    val id: String,
    val title: String,
    val description: String,
    val status: String,         // "todo" | "in_progress" | "completed"
    val priority: String?,      // "low" | "medium" | "high"
    val type: String?,
    val dueDate: String?,
    val duration: Int?,
    val reminderMinutes: Int? = 30,
    val noteId: String? = null,
    val isShared: Boolean,
    val participants: List<TaskParticipant> = emptyList(),
    val recurrenceFrequency: String? = "none",
    val completedAt: String? = null,
    val createdAt: String? = null,
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
        get() = dueDate?.take(10)
}
