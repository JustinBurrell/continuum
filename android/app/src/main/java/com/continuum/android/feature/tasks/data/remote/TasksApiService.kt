package com.continuum.android.feature.tasks.data.remote

import com.continuum.android.feature.tasks.data.remote.dto.*
import retrofit2.http.*

interface TasksApiService {

    @GET("tasks")
    suspend fun getTasks(
        @Query("search") search: String? = null,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): TasksResponseDto

    @GET("tasks/{id}")
    suspend fun getTask(@Path("id") id: String): TaskResponseDto

    @GET("tasks/shared")
    suspend fun getSharedTasks(@Query("search") search: String? = null): TasksResponseDto

    @POST("tasks")
    suspend fun createTask(@Body request: CreateTaskRequestDto): TaskResponseDto

    @PATCH("tasks/{id}/status")
    suspend fun updateTaskStatus(
        @Path("id") id: String,
        @Body request: UpdateTaskStatusRequestDto
    ): TaskResponseDto

    @PATCH("tasks/{id}/participant-status")
    suspend fun updateParticipantTaskStatus(
        @Path("id") id: String,
        @Body request: UpdateTaskStatusRequestDto
    ): TaskResponseDto

    @PATCH("tasks/{id}/participants")
    suspend fun updateTaskParticipants(
        @Path("id") id: String,
        @Body request: UpdateTaskParticipantsRequestDto
    ): TaskResponseDto

    @PUT("tasks/{id}")
    suspend fun updateTask(
        @Path("id") id: String,
        @Body request: UpdateTaskRequestDto
    ): TaskResponseDto

    @DELETE("tasks/{id}")
    suspend fun deleteTask(@Path("id") id: String): retrofit2.Response<Unit>
}
