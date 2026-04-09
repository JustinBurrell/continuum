package com.continuum.android.feature.profile.domain

data class Profile(
    val id: String,
    val firstName: String,
    val lastName: String,
    val username: String,
    val email: String,
    val bio: String?,
    val avatarUrl: String?,
    val isEmailVerified: Boolean,
    val isGoogleLinked: Boolean,
    val createdAt: String
) {
    val fullName: String get() = "$firstName $lastName".trim().ifEmpty { username }
    val initials: String get() = buildString {
        firstName.firstOrNull()?.let { append(it.uppercaseChar()) }
        lastName.firstOrNull()?.let { append(it.uppercaseChar()) }
        if (isEmpty()) username.firstOrNull()?.let { append(it.uppercaseChar()) }
    }
}
