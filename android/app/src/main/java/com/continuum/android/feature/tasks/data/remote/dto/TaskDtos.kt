package com.continuum.android.feature.tasks.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class TaskDto(
    @Json(name = "_id") val id: String = "",
    val title: String = "",
    val description: String = "",
    val status: String = "todo",
    val priority: String? = null,
    val type: String? = null,
    val dueDate: String? = null,
    val duration: Int? = null,
    val isShared: Boolean = false,
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
    val dueDate: String? = null
)
