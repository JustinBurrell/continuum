package com.continuum.android.feature.profile.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ProfileDto(
    @Json(name = "_id") val id: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val username: String = "",
    val email: String = "",
    val bio: String? = null,
    @Json(name = "avatarUrl") val avatar: String? = null,
    val isEmailVerified: Boolean = false,
    val googleId: String? = null,
    val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class ProfileResponseDto(
    val success: Boolean = false,
    val user: ProfileDto = ProfileDto()
)

@JsonClass(generateAdapter = true)
data class UpdateProfileRequestDto(
    val firstName: String? = null,
    val lastName: String? = null,
    val username: String? = null,
    val bio: String? = null
)

@JsonClass(generateAdapter = true)
data class ChangePasswordRequestDto(
    val currentPassword: String,
    val newPassword: String
)

@JsonClass(generateAdapter = true)
data class SimpleMessageDto(
    val success: Boolean = false,
    val message: String? = null
)
