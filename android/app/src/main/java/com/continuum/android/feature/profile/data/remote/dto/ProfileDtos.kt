package com.continuum.android.feature.profile.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ProfileSettingsDto(
    val activityVisibility: String? = null,
    val emailNotifications: Boolean? = null,
    val pushNotifications: Boolean? = null
)

@JsonClass(generateAdapter = true)
data class ProfileDto(
    @Json(name = "_id") val id: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val username: String = "",
    val email: String = "",
    val bio: String? = null,
    @Json(name = "avatarUrl") val avatar: String? = null,
    val linkedinUrl: String? = null,
    val instagramHandle: String? = null,
    val isEmailVerified: Boolean = false,
    val emailVerified: Boolean = false,
    val googleId: String? = null,
    val isDemo: Boolean = false,
    val pendingDeletion: Boolean = false,
    val scheduledDeletionAt: String? = null,
    val settings: ProfileSettingsDto? = null,
    val lastViewedActivityAt: String? = null,
    val createdAt: String = "",
    val roles: List<String> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ProfileResponseDto(
    val success: Boolean = false,
    val user: ProfileDto = ProfileDto(),
    val data: ProfileDto? = null
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
data class UpdateUsernameRequestDto(
    val username: String
)

@JsonClass(generateAdapter = true)
data class DeleteAccountRequestDto(
    val password: String
)

@JsonClass(generateAdapter = true)
data class SimpleMessageDto(
    val success: Boolean = false,
    val message: String? = null
)

@JsonClass(generateAdapter = true)
data class SessionDto(
    @Json(name = "_id") val id: String = "",
    val deviceId: String? = null,
    val isCurrent: Boolean = false,
    val createdAt: String = "",
    val lastUsedAt: String? = null,
    val ipLocation: String? = null
)

@JsonClass(generateAdapter = true)
data class SessionsResponseDto(
    val success: Boolean = false,
    val sessions: List<SessionDto> = emptyList()
)
