package com.continuum.android.feature.tasks.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

/** Parsed by [TaskParticipantDtoAdapter] (supports string or populated user for userId). */
data class TaskParticipantDto(
    val userId: String = "",
    val status: String = "todo",
    val completedAt: String? = null,
    val profileFirstName: String? = null,
    val profileLastName: String? = null,
    val profileUsername: String? = null,
    val profileAvatarUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class TaskRecurrenceDto(
    val frequency: String? = "none",
    val interval: Int? = 1,
    val daysOfWeek: List<Int>? = null,
    val endDate: String? = null,
    val parentTaskId: String? = null
)

@JsonClass(generateAdapter = true)
data class TaskDto(
    @Json(name = "_id") val id: String = "",
    val userId: String? = null,
    val title: String = "",
    val description: String = "",
    val status: String = "todo",
    val priority: String? = null,
    val type: String? = null,
    val dueDate: String? = null,
    val duration: Int? = null,
    val reminderMinutes: Int? = 30,
    val noteId: String? = null,
    val isShared: Boolean = false,
    val participants: List<TaskParticipantDto>? = null,
    val recurrence: TaskRecurrenceDto? = null,
    val completedAt: String? = null,
    val createdAt: String? = null,
    val updatedAt: String = ""
)

@JsonClass(generateAdapter = true)
data class TasksResponseDto(
    val success: Boolean = false,
    val tasks: List<TaskDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class TaskResponseDto(
    val success: Boolean = false,
    val task: TaskDto = TaskDto()
)

@JsonClass(generateAdapter = true)
data class CreateTaskRequestDto(
    val title: String,
    val description: String = "",
    val status: String = "todo",
    val priority: String? = null,
    val type: String? = null,
    val dueDate: String? = null,
    val duration: Int? = null,
    val isShared: Boolean = false
)

@JsonClass(generateAdapter = true)
data class UpdateTaskStatusRequestDto(
    val status: String
)

@JsonClass(generateAdapter = true)
data class UpdateTaskRequestDto(
    val title: String? = null,
    val description: String? = null,
    val priority: String? = null,
    val type: String? = null,
    val dueDate: String? = null,
    val duration: Int? = null,
    val reminderMinutes: Int? = null,
    val noteId: String? = null,
    val recurrence: TaskRecurrenceDto? = null
)

@JsonClass(generateAdapter = true)
data class TaskParticipantUserIdDto(
    val userId: String
)

@JsonClass(generateAdapter = true)
data class UpdateTaskParticipantsRequestDto(
    val participants: List<TaskParticipantUserIdDto>
)
