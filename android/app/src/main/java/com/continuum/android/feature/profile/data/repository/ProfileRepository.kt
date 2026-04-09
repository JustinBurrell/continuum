package com.continuum.android.feature.profile.data.repository

import com.continuum.android.feature.profile.data.remote.ProfileApiService
import com.continuum.android.feature.profile.data.remote.dto.ChangePasswordRequestDto
import com.continuum.android.feature.profile.data.remote.dto.UpdateProfileRequestDto
import com.continuum.android.feature.profile.domain.Profile
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProfileRepository @Inject constructor(
    private val api: ProfileApiService
) {
    suspend fun getProfile(): Result<Profile> = runCatching {
        api.getProfile().data.let { dto ->
            Profile(
                id = dto.id,
                firstName = dto.firstName,
                lastName = dto.lastName,
                username = dto.username,
                email = dto.email,
                bio = dto.bio,
                avatarUrl = dto.avatar,
                isEmailVerified = dto.isEmailVerified,
                isGoogleLinked = dto.googleId != null,
                createdAt = dto.createdAt
            )
        }
    }

    suspend fun updateProfile(
        firstName: String?,
        lastName: String?,
        username: String?,
        bio: String?
    ): Result<Profile> = runCatching {
        api.updateProfile(
            UpdateProfileRequestDto(
                firstName = firstName,
                lastName = lastName,
                username = username,
                bio = bio
            )
        ).data.let { dto ->
            Profile(
                id = dto.id,
                firstName = dto.firstName,
                lastName = dto.lastName,
                username = dto.username,
                email = dto.email,
                bio = dto.bio,
                avatarUrl = dto.avatar,
                isEmailVerified = dto.isEmailVerified,
                isGoogleLinked = dto.googleId != null,
                createdAt = dto.createdAt
            )
        }
    }

    suspend fun changePassword(current: String, new: String): Result<Unit> = runCatching {
        api.changePassword(ChangePasswordRequestDto(current, new))
        Unit
    }

    suspend fun deleteAccount(): Result<Unit> = runCatching {
        api.deleteAccount()
        Unit
    }
}
