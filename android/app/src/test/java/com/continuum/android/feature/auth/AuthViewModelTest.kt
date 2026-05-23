package com.continuum.android.feature.auth

import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.auth.data.repository.AuthRepository
import com.continuum.android.feature.auth.domain.User
import com.continuum.android.feature.auth.presentation.AuthUiState
import com.continuum.android.feature.auth.presentation.AuthViewModel
import com.continuum.android.feature.users.data.repository.UsersRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: AuthRepository = mockk()
    private val usersRepository: UsersRepository = mockk(relaxed = true)
    private val tokenManager: TokenManager = mockk(relaxed = true)
    private lateinit var viewModel: AuthViewModel

    private val fakeUser = User(
        id = "u1",
        firstName = "E2E",
        lastName = "User",
        username = "e2euser",
        email = "e2e@continuum.test",
        avatar = null,
        isEmailVerified = true
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = AuthViewModel(repository, usersRepository, tokenManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `login success emits Success state with user`() = runTest {
        coEvery { repository.login("e2e@continuum.test", "pass") } returns Result.success(fakeUser)

        viewModel.login("e2e@continuum.test", "pass")

        val state = viewModel.uiState.value
        assertTrue("Expected Success state", state is AuthUiState.Success)
        assertEquals(fakeUser, (state as AuthUiState.Success).user)
    }

    @Test
    fun `login failure emits Error state`() = runTest {
        coEvery { repository.login(any(), any()) } returns Result.failure(Exception("Invalid credentials"))

        viewModel.login("wrong@test.com", "badpass")

        assertTrue("Expected Error state", viewModel.uiState.value is AuthUiState.Error)
    }

    @Test
    fun `register success emits Success state with user`() = runTest {
        coEvery {
            repository.register("E2E", "User", "e2euser", "e2e@continuum.test", "pass")
        } returns Result.success(fakeUser)

        viewModel.register("E2E", "User", "e2euser", "e2e@continuum.test", "pass")

        assertTrue("Expected Success state", viewModel.uiState.value is AuthUiState.Success)
    }

    @Test
    fun `checkAuthAndGetUser success emits Success state`() = runTest {
        coEvery { repository.getMe() } returns Result.success(fakeUser)

        viewModel.checkAuthAndGetUser()

        assertTrue("Expected Success state", viewModel.uiState.value is AuthUiState.Success)
    }

    @Test
    fun `checkAuthAndGetUser failure emits Idle state`() = runTest {
        coEvery { repository.getMe() } returns Result.failure(Exception("Unauthorized"))

        viewModel.checkAuthAndGetUser()

        assertEquals(AuthUiState.Idle, viewModel.uiState.value)
    }

    @Test
    fun `logout calls repository logout`() = runTest {
        coEvery { repository.logout() } returns Unit

        viewModel.logout()

        coVerify { repository.logout() }
    }

    @Test
    fun `resetState restores Idle state`() = runTest {
        coEvery { repository.login(any(), any()) } returns Result.failure(Exception("Error"))
        viewModel.login("x", "y")
        assertTrue(viewModel.uiState.value is AuthUiState.Error)

        viewModel.resetState()

        assertEquals(AuthUiState.Idle, viewModel.uiState.value)
    }
}
