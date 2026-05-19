package com.continuum.android.feature.auth

import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.auth.data.remote.AuthApiService
import com.continuum.android.feature.auth.data.remote.dto.AuthResponseDto
import com.continuum.android.feature.auth.data.remote.dto.GetMeResponseDto
import com.continuum.android.feature.auth.data.remote.dto.UserDto
import com.continuum.android.feature.auth.data.repository.AuthRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class AuthRepositoryTest {

    private val api: AuthApiService = mockk()
    private val tokenManager: TokenManager = mockk(relaxed = true)
    private lateinit var repository: AuthRepository

    private fun fakeUserDto() = UserDto(
        id = "u1", firstName = "Justin", lastName = "B", username = "justin",
        email = "j@test.com", avatar = null, isEmailVerified = true
    )

    private fun fakeAuthResponse() = AuthResponseDto(
        success = true,
        token = "access-token",
        refreshToken = "refresh-token",
        user = fakeUserDto()
    )

    @Before
    fun setUp() {
        repository = AuthRepository(api, tokenManager)
    }

    @Test
    fun `login success — saves tokens and returns user`() = runTest {
        coEvery { api.login(any()) } returns fakeAuthResponse()

        val result = repository.login("j@test.com", "pass")

        assertTrue(result.isSuccess)
        assertEquals("justin", result.getOrNull()?.username)
        coVerify { tokenManager.saveTokens("access-token", "refresh-token") }
    }

    @Test
    fun `login failure — returns failure result`() = runTest {
        coEvery { api.login(any()) } throws RuntimeException("Invalid credentials")

        val result = repository.login("bad@test.com", "bad")

        assertTrue(result.isFailure)
        assertEquals("Invalid credentials", result.exceptionOrNull()?.message)
    }

    @Test
    fun `register success — saves tokens and returns user`() = runTest {
        coEvery { api.register(any()) } returns fakeAuthResponse()

        val result = repository.register("Justin", "B", "justin", "j@test.com", "pass")

        assertTrue(result.isSuccess)
        assertEquals("u1", result.getOrNull()?.id)
    }

    @Test
    fun `forgotPassword success — returns success unit`() = runTest {
        coEvery { api.forgotPassword(any()) } returns mockk(relaxed = true)

        val result = repository.forgotPassword("j@test.com")

        assertTrue(result.isSuccess)
    }

    @Test
    fun `forgotPassword failure — returns failure`() = runTest {
        coEvery { api.forgotPassword(any()) } throws RuntimeException("User not found")

        val result = repository.forgotPassword("ghost@test.com")

        assertTrue(result.isFailure)
    }

    @Test
    fun `resetPassword success — returns success unit`() = runTest {
        coEvery { api.resetPassword(any()) } returns mockk(relaxed = true)

        val result = repository.resetPassword("tok123", "newpass")

        assertTrue(result.isSuccess)
    }

    @Test
    fun `getMe success — maps dto to domain user`() = runTest {
        coEvery { api.getMe() } returns GetMeResponseDto(success = true, user = fakeUserDto())

        val result = repository.getMe()

        assertTrue(result.isSuccess)
        assertEquals("Justin", result.getOrNull()?.firstName)
    }

    @Test
    fun `getMe failure — returns failure`() = runTest {
        coEvery { api.getMe() } throws RuntimeException("Unauthorized")

        val result = repository.getMe()

        assertTrue(result.isFailure)
    }

    @Test
    fun `logout — clears tokens locally even if server call fails`() = runTest {
        coEvery { tokenManager.getRefreshToken() } returns "refresh-token"
        coEvery { api.mobileLogout(any()) } throws RuntimeException("Network error")

        repository.logout()

        verify { tokenManager.clearTokens(any()) }
    }

    @Test
    fun `isLoggedIn — returns true when access token exists`() {
        coEvery { tokenManager.getAccessToken() } returns "token"

        assertTrue(repository.isLoggedIn())
    }

    @Test
    fun `isLoggedIn — returns false when no access token`() {
        coEvery { tokenManager.getAccessToken() } returns null

        assertFalse(repository.isLoggedIn())
    }

    @Test
    fun `loginWithGoogle success — saves tokens and returns user`() = runTest {
        coEvery { api.loginWithGoogle(any()) } returns fakeAuthResponse()

        val result = repository.loginWithGoogle("google-id-token")

        assertTrue(result.isSuccess)
        assertEquals("u1", result.getOrNull()?.id)
        coVerify { tokenManager.saveTokens("access-token", "refresh-token") }
    }
}
