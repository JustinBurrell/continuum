package com.continuum.android.feature.profile.domain

data class PushNotificationSettings(
    val messages: Boolean = true,
    val comments: Boolean = true,
    val likes: Boolean = true,
    val friendRequests: Boolean = true,
    val tasks: Boolean = true,
    val sharedContent: Boolean = true,
)

data class Profile(
    val id: String,
    val firstName: String,
    val lastName: String,
    val username: String,
    val email: String,
    val bio: String?,
    val avatarUrl: String?,
    val linkedinUrl: String?,
    val instagramHandle: String?,
    val isEmailVerified: Boolean,
    val isGoogleLinked: Boolean,
    val isDemo: Boolean,
    val pendingDeletion: Boolean,
    val scheduledDeletionAt: String?,
    val activityVisibility: String,
    val emailNotifications: Boolean,
    val pushNotifications: PushNotificationSettings,
    val createdAt: String,
    val roles: List<String> = emptyList(),
    val lastViewedActivityAt: String? = null,
    val onboardingCompleted: Boolean = false,
    val tourCompleted: Boolean = false,
    val onboardingGoal: String? = null
) {
    val fullName: String get() = "$firstName $lastName".trim().ifEmpty { username }
    val initials: String get() = buildString {
        firstName.firstOrNull()?.let { append(it.uppercaseChar()) }
        lastName.firstOrNull()?.let { append(it.uppercaseChar()) }
        if (isEmpty()) username.firstOrNull()?.let { append(it.uppercaseChar()) }
    }
}

data class Session(
    val id: String,
    val deviceId: String,
    val isCurrent: Boolean,
    val createdAt: String,
    val lastUsedAt: String?,
    val ipLocation: String?
)
