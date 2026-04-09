package com.continuum.android.feature.auth.domain

data class User(
    val id: String,
    val firstName: String,
    val lastName: String,
    val username: String?,
    val email: String,
    val avatar: String?,
    val isEmailVerified: Boolean = false
) {
    val fullName: String get() = "$firstName $lastName".trim()
    val initials: String
        get() = buildString {
            firstName.firstOrNull()?.let { append(it.uppercaseChar()) }
            lastName.firstOrNull()?.let { append(it.uppercaseChar()) }
        }.ifEmpty { email.firstOrNull()?.uppercaseChar()?.toString() ?: "?" }
}
