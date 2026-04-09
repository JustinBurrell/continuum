package com.continuum.android.feature.career.data.remote

import com.continuum.android.feature.career.data.remote.dto.*
import okhttp3.MultipartBody
import retrofit2.http.*

interface CareerApiService {

    @GET("applications")
    suspend fun getApplications(): ApplicationsResponseDto

    @GET("applications/dashboard")
    suspend fun getApplicationsDashboard(): ApplicationsDashboardResponseDto

    @POST("applications")
    suspend fun createApplication(@Body request: CreateApplicationRequestDto): ApplicationResponseDto

    @PATCH("applications/{id}")
    suspend fun updateApplication(
        @Path("id") id: String,
        @Body request: UpdateApplicationRequestDto
    ): ApplicationResponseDto

    @DELETE("applications/{id}")
    suspend fun deleteApplication(@Path("id") id: String): retrofit2.Response<Unit>

    @GET("resumes")
    suspend fun getResumes(): ResumesResponseDto

    @Multipart
    @POST("resumes/upload")
    suspend fun uploadResume(
        @Part file: MultipartBody.Part
    ): ResumeResponseDto

    @DELETE("resumes/{id}")
    suspend fun deleteResume(@Path("id") id: String): retrofit2.Response<Unit>

    @POST("resumes/{id}/feedback")
    suspend fun generateFeedback(@Path("id") id: String): ResumeFeedbackResponseDto
}
