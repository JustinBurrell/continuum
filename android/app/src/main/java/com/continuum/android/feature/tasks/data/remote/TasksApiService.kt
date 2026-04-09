package com.continuum.android.feature.tasks.data.remote

import com.continuum.android.feature.tasks.data.remote.dto.*
import retrofit2.http.*

interface TasksApiService {

    @GET("tasks")
    suspend fun getTasks(): TasksResponseDto

    @POST("tasks")
    suspend fun createTask(@Body request: CreateTaskRequestDto): TaskResponseDto

    @PATCH("tasks/{id}/status")
    suspend fun updateTaskStatus(
        @Path("id") id: String,
        @Body request: UpdateTaskStatusRequestDto
    ): TaskResponseDto

    @PUT("tasks/{id}")
    suspend fun updateTask(
        @Path("id") id: String,
        @Body request: UpdateTaskRequestDto
    ): TaskResponseDto

    @DELETE("tasks/{id}")
    suspend fun deleteTask(@Path("id") id: String): retrofit2.Response<Unit>
}
