package com.continuum.android.feature.auth.data.repository

import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.auth.data.remote.AuthApiService
import com.continuum.android.feature.auth.data.remote.dto.*
import com.continuum.android.feature.auth.domain.User
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: AuthApiService,
    private val tokenManager: TokenManager
) {

    private fun UserDto.toDomain() = User(
        id = id,
        firstName = firstName,
        lastName = lastName,
        username = username,
        email = email,
        avatar = avatar,
        isEmailVerified = isEmailVerified,
        isDemo = isDemo
    )

    suspend fun login(email: String, password: String): Result<User> = runCatching {
        val response = api.login(LoginRequestDto(email, password))
        tokenManager.saveTokens(response.token, response.refreshToken)
        response.user.toDomain()
    }

    suspend fun loginWithGoogle(idToken: String): Result<User> = runCatching {
        val response = api.loginWithGoogle(GoogleLoginRequestDto(idToken))
        tokenManager.saveTokens(response.token, response.refreshToken)
        response.user.toDomain()
    }

    suspend fun register(
        firstName: String,
        lastName: String,
        username: String,
        email: String,
        password: String
    ): Result<User> = runCatching {
        val response = api.register(
            RegisterRequestDto(firstName, lastName, username, email, password)
        )
        if (response.token.isNotBlank()) {
            tokenManager.saveTokens(response.token, response.refreshToken)
        }
        response.user.toDomain()
    }

    suspend fun forgotPassword(email: String): Result<Unit> = runCatching {
        api.forgotPassword(ForgotPasswordRequestDto(email))
        Unit
    }

    suspend fun resetPassword(token: String, password: String): Result<Unit> = runCatching {
        api.resetPassword(token, ResetPasswordRequestDto(password))
        Unit
    }

    suspend fun verifyEmail(token: String): Result<Unit> = runCatching {
        api.verifyEmail(token)
        Unit
    }

    suspend fun getMe(): Result<User> = runCatching {
        val response = api.getMe()
        response.user.toDomain()
    }

    fun logout() = tokenManager.clearTokens()

    fun isLoggedIn(): Boolean = tokenManager.getAccessToken() != null
}
