package com.continuum.android.feature.profile.data.repository

import com.continuum.android.feature.profile.data.remote.ProfileApiService
import com.continuum.android.feature.profile.data.remote.dto.*
import com.continuum.android.feature.profile.domain.Profile
import com.continuum.android.feature.profile.domain.Session
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProfileRepository @Inject constructor(
    private val api: ProfileApiService
) {

    // Single-use cache: populated by the splash pre-fetch, consumed once by the first
    // DashboardViewModel call, then cleared so all subsequent fetches go to the network.
    @Volatile private var _splashCache: Profile? = null

    fun primeSplashCache(profile: Profile) { _splashCache = profile }
    fun clearProfileCache() { _splashCache = null }

    private fun ProfileDto.toDomain(): Profile {
        val dto = this
        return Profile(
            id = dto.id,
            firstName = dto.firstName,
            lastName = dto.lastName,
            username = dto.username,
            email = dto.email,
            bio = dto.bio,
            avatarUrl = dto.avatar,
            linkedinUrl = dto.linkedinUrl,
            instagramHandle = dto.instagramHandle,
            isEmailVerified = dto.isEmailVerified || dto.emailVerified,
            isGoogleLinked = dto.googleId != null,
            isDemo = dto.isDemo,
            pendingDeletion = dto.pendingDeletion,
            scheduledDeletionAt = dto.scheduledDeletionAt,
            activityVisibility = dto.settings?.activityVisibility ?: "friends",
            emailNotifications = dto.settings?.emailNotifications ?: true,
            pushNotifications = dto.settings?.pushNotifications ?: true,
            createdAt = dto.createdAt,
            roles = dto.roles,
            lastViewedActivityAt = dto.lastViewedActivityAt,
            onboardingCompleted = dto.onboardingCompleted ?: false,
            tourCompleted = dto.tourCompleted ?: false,
            onboardingGoal = dto.onboardingGoal
        )
    }

    private fun ProfileResponseDto.resolve(): ProfileDto = data ?: user

    suspend fun getProfile(): Result<Profile> = runCatching {
        _splashCache?.also { _splashCache = null } ?: api.getProfile().resolve().toDomain()
    }

    suspend fun getLastViewedActivityAt(): String? = try {
        api.getProfile().resolve().lastViewedActivityAt
    } catch (_: Exception) { null }

    suspend fun updateProfileMultipart(fields: Map<String, String>): Result<Profile> = runCatching {
        val textType = "text/plain".toMediaType()
        val parts = fields.mapValues { (_, v) -> v.toRequestBody(textType) }
        api.updateProfileMultipart(parts).resolve().toDomain()
    }

    suspend fun updateProfile(
        firstName: String?,
        lastName: String?,
        username: String?,
        bio: String?
    ): Result<Profile> = runCatching {
        api.updateProfile(
            UpdateProfileRequestDto(firstName = firstName, lastName = lastName, username = username, bio = bio)
        ).resolve().toDomain()
    }

    suspend fun updateUsername(username: String): Result<Profile> = runCatching {
        api.updateUsername(UpdateUsernameRequestDto(username)).resolve().toDomain()
    }

    suspend fun changePassword(current: String, new: String): Result<Unit> = runCatching {
        api.changePassword(ChangePasswordRequestDto(current, new))
        Unit
    }

    suspend fun deleteAccount(): Result<Unit> = runCatching {
        api.deleteAccount()
        Unit
    }

    suspend fun sendVerificationEmail(): Result<Unit> = runCatching {
        api.sendVerificationEmail()
        Unit
    }

    suspend fun logoutAll(): Result<Unit> = runCatching {
        api.logoutAll()
        Unit
    }

    suspend fun getSessions(): Result<List<Session>> = runCatching {
        api.getSessions().sessions.map { dto ->
            Session(
                id = dto.id,
                deviceId = dto.deviceId ?: "Unknown device",
                isCurrent = dto.isCurrent,
                createdAt = dto.createdAt,
                lastUsedAt = dto.lastUsedAt,
                ipLocation = dto.ipLocation
            )
        }
    }

    suspend fun revokeSession(sessionId: String): Result<Unit> = runCatching {
        api.revokeSession(sessionId)
        Unit
    }

    suspend fun restoreAccount(): Result<Profile> = runCatching {
        api.restoreAccount().resolve().toDomain()
    }

    suspend fun uploadAvatar(file: File): Result<Profile> = runCatching {
        val mediaType = "image/*".toMediaType()
        val requestBody = file.asRequestBody(mediaType)
        val part = MultipartBody.Part.createFormData("avatar", file.name, requestBody)
        api.uploadAvatar(part).resolve().toDomain()
    }

    suspend fun unlinkGoogle(): Result<Unit> = runCatching {
        api.unlinkGoogle()
        Unit
    }

    suspend fun completeOnboarding(): Result<Profile> = runCatching {
        api.completeOnboarding().resolve().toDomain()
    }

    suspend fun completeTour(): Result<Profile> = runCatching {
        api.completeTour().resolve().toDomain()
    }

    suspend fun resetTour(): Result<Profile> = runCatching {
        api.resetTour().resolve().toDomain()
    }

    suspend fun updateOnboardingGoal(goal: String): Result<Profile> = runCatching {
        api.updateProfile(UpdateProfileRequestDto(onboardingGoal = goal)).resolve().toDomain()
    }
}
