package com.continuum.android.feature.profile.data.remote

import com.continuum.android.feature.profile.data.remote.dto.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.*

interface ProfileApiService {

    @GET("auth/me")
    suspend fun getProfile(): ProfileResponseDto

    @Multipart
    @PATCH("auth/me/profile")
    suspend fun updateProfileMultipart(@PartMap fields: Map<String, @JvmSuppressWildcards RequestBody>): ProfileResponseDto

    @PATCH("auth/me/profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequestDto): ProfileResponseDto

    @PATCH("auth/me/username")
    suspend fun updateUsername(@Body request: UpdateUsernameRequestDto): ProfileResponseDto

    @PATCH("auth/me/password")
    suspend fun changePassword(@Body request: ChangePasswordRequestDto): SimpleMessageDto

    @DELETE("auth/me")
    suspend fun deleteAccount(): SimpleMessageDto

    @POST("auth/send-verification")
    suspend fun sendVerificationEmail(): SimpleMessageDto

    @POST("auth/logout-all")
    suspend fun logoutAll(): SimpleMessageDto

    @GET("auth/sessions")
    suspend fun getSessions(): SessionsResponseDto

    @DELETE("auth/sessions/{sessionId}")
    suspend fun revokeSession(@Path("sessionId") sessionId: String): SimpleMessageDto

    @POST("auth/me/restore")
    suspend fun restoreAccount(): ProfileResponseDto

    @Multipart
    @PATCH("auth/me/profile")
    suspend fun uploadAvatar(@Part avatar: MultipartBody.Part): ProfileResponseDto
}
