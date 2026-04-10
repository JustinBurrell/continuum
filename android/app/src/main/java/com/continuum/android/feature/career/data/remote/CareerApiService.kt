package com.continuum.android.feature.career.data.remote

import com.continuum.android.feature.career.data.remote.dto.*
import okhttp3.MultipartBody
import retrofit2.http.*

interface CareerApiService {

    @GET("applications")
    suspend fun getApplications(
        @Query("search") search: String? = null,
        @Query("status") status: String? = null
    ): ApplicationsResponseDto

    @GET("applications/dashboard")
    suspend fun getApplicationsDashboard(): ApplicationsDashboardResponseDto

    @POST("applications")
    suspend fun createApplication(@Body request: CreateApplicationRequestDto): ApplicationResponseDto

    @PUT("applications/{id}")
    suspend fun updateApplication(
        @Path("id") id: String,
        @Body request: UpdateApplicationRequestDto
    ): ApplicationResponseDto

    @GET("applications/{id}")
    suspend fun getApplication(@Path("id") id: String): ApplicationResponseDto

    @DELETE("applications/{id}")
    suspend fun deleteApplication(@Path("id") id: String): retrofit2.Response<Unit>

    @POST("applications/{id}/contacts")
    suspend fun addContact(
        @Path("id") id: String,
        @Body request: AddContactRequestDto
    ): ApplicationResponseDto

    @DELETE("applications/{id}/contacts/{contactId}")
    suspend fun deleteContact(
        @Path("id") id: String,
        @Path("contactId") contactId: String
    ): ApplicationResponseDto

    @POST("applications/{id}/reminders")
    suspend fun addReminder(
        @Path("id") id: String,
        @Body request: AddReminderRequestDto
    ): ApplicationResponseDto

    @DELETE("applications/{id}/reminders/{reminderId}")
    suspend fun deleteReminder(
        @Path("id") id: String,
        @Path("reminderId") reminderId: String
    ): ApplicationResponseDto

    @GET("resumes")
    suspend fun getResumes(): ResumesResponseDto

    @Multipart
    @POST("resumes/upload")
    suspend fun uploadResume(
        @Part resume: MultipartBody.Part
    ): ResumeResponseDto

    @DELETE("resumes/{id}")
    suspend fun deleteResume(@Path("id") id: String): retrofit2.Response<Unit>

    @POST("resumes/{id}/feedback")
    suspend fun generateFeedback(@Path("id") id: String): ResumeFeedbackResponseDto
}
