package com.continuum.android.feature.auth.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LoginRequestDto(
    val email: String,
    val password: String
)

@JsonClass(generateAdapter = true)
data class GoogleLoginRequestDto(
    val idToken: String
)

@JsonClass(generateAdapter = true)
data class RegisterRequestDto(
    val firstName: String,
    val lastName: String,
    val username: String,
    val email: String,
    val password: String
)

@JsonClass(generateAdapter = true)
data class ForgotPasswordRequestDto(
    val email: String
)

@JsonClass(generateAdapter = true)
data class ResetPasswordRequestDto(
    val password: String
)

@JsonClass(generateAdapter = true)
data class UserDto(
    @Json(name = "_id") val id: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val username: String? = null,
    val email: String = "",
    @Json(name = "avatarUrl") val avatar: String? = null,
    val isEmailVerified: Boolean = false,
    val isDemo: Boolean = false
)

@JsonClass(generateAdapter = true)
data class AuthResponseDto(
    val success: Boolean = false,
    val token: String = "",
    val refreshToken: String = "",
    val user: UserDto = UserDto()
)

@JsonClass(generateAdapter = true)
data class GetMeResponseDto(
    val success: Boolean = false,
    val user: UserDto = UserDto()
)

@JsonClass(generateAdapter = true)
data class SimpleSuccessDto(
    val success: Boolean = false,
    val message: String? = null
)
