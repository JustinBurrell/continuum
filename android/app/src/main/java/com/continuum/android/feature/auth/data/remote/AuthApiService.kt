package com.continuum.android.feature.auth.data.remote

import com.continuum.android.feature.auth.data.remote.dto.*
import retrofit2.http.*

interface AuthApiService {

    @POST("auth/mobile/login")
    suspend fun login(@Body request: LoginRequestDto): AuthResponseDto

    @POST("auth/google/mobile")
    suspend fun loginWithGoogle(@Body request: GoogleLoginRequestDto): AuthResponseDto

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequestDto): AuthResponseDto

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequestDto): SimpleSuccessDto

    @POST("auth/reset-password")
    suspend fun resetPassword(
        @Query("token") token: String,
        @Body request: ResetPasswordRequestDto
    ): SimpleSuccessDto

    @GET("auth/verify-email")
    suspend fun verifyEmail(@Query("token") token: String): SimpleSuccessDto

    @GET("auth/me")
    suspend fun getMe(): GetMeResponseDto
}
