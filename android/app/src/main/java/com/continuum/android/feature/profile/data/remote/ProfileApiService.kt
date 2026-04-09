package com.continuum.android.feature.profile.data.remote

import com.continuum.android.feature.profile.data.remote.dto.*
import retrofit2.http.*

interface ProfileApiService {

    @GET("auth/me")
    suspend fun getProfile(): ProfileResponseDto

    @PATCH("auth/me/profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequestDto): ProfileResponseDto

    @PATCH("auth/me/password")
    suspend fun changePassword(@Body request: ChangePasswordRequestDto): SimpleMessageDto

    @DELETE("auth/me")
    suspend fun deleteAccount(): SimpleMessageDto
}
