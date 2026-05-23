package com.continuum.android.feature.profile

import com.continuum.android.core.data.ProfileUpdateNotifier
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import com.continuum.android.feature.profile.domain.PushNotificationSettings
import com.continuum.android.feature.profile.domain.Session
import com.continuum.android.feature.profile.presentation.ProfileViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ProfileViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: ProfileRepository = mockk()
    private val tokenManager: TokenManager = mockk(relaxed = true)
    private val profileUpdateNotifier = ProfileUpdateNotifier()
    private lateinit var viewModel: ProfileViewModel

    private fun fakeProfile(isDemo: Boolean = false) = Profile(
        id = "u1", firstName = "Justin", lastName = "B", username = "justin",
        email = "j@test.com", bio = "Bio", avatarUrl = null, linkedinUrl = null,
        instagramHandle = null, isEmailVerified = true, isGoogleLinked = false, isDemo = isDemo,
        pendingDeletion = false, scheduledDeletionAt = null, activityVisibility = "friends",
        emailNotifications = true, pushNotifications = PushNotificationSettings(), createdAt = "2025-01-01"
    )

    private fun fakeSession(id: String = "s1", isCurrent: Boolean = true) = Session(
        id = id, deviceId = "device-123", isCurrent = isCurrent,
        createdAt = "2025-01-01", lastUsedAt = "2025-01-02", ipLocation = "US"
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = ProfileViewModel(repository, tokenManager, profileUpdateNotifier)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    // ─── load ──────────────────────────────────────────────────────────────────

    @Test
    fun `load success — populates profile and loads sessions for non-demo`() = runTest {
        coEvery { repository.getProfile() } returns Result.success(fakeProfile())
        coEvery { repository.getSessions() } returns Result.success(listOf(fakeSession()))

        viewModel.load()
        advanceUntilIdle()

        assertNotNull(viewModel.state.value.profile)
        assertEquals("Justin", viewModel.state.value.profile?.firstName)
        assertFalse(viewModel.state.value.isLoading)
        assertNull(viewModel.state.value.error)
    }

    @Test
    fun `load success — skips sessions for demo user`() = runTest {
        coEvery { repository.getProfile() } returns Result.success(fakeProfile(isDemo = true))

        viewModel.load()
        advanceUntilIdle()

        assertNotNull(viewModel.state.value.profile)
        coVerify(exactly = 0) { repository.getSessions() }
    }

    @Test
    fun `load failure — sets error state`() = runTest {
        coEvery { repository.getProfile() } returns Result.failure(Exception("Server error"))

        viewModel.load()
        advanceUntilIdle()

        assertEquals("Server error", viewModel.state.value.error)
        assertFalse(viewModel.state.value.isLoading)
    }

    // ─── loadSessions ──────────────────────────────────────────────────────────

    @Test
    fun `loadSessions success — populates sessions list`() = runTest {
        val sessions = listOf(fakeSession("s1"), fakeSession("s2", false))
        coEvery { repository.getSessions() } returns Result.success(sessions)

        viewModel.loadSessions()
        advanceUntilIdle()

        assertEquals(2, viewModel.state.value.sessions.size)
        assertFalse(viewModel.state.value.sessionsLoading)
    }

    // ─── updateProfileFields ───────────────────────────────────────────────────

    @Test
    fun `updateProfileFields success — updates profile and sets successMessage`() = runTest {
        val updated = fakeProfile().copy(firstName = "Alex")
        coEvery { repository.updateProfileMultipart(mapOf("firstName" to "Alex")) } returns Result.success(updated)

        viewModel.updateProfileFields(mapOf("firstName" to "Alex"))
        advanceUntilIdle()

        assertEquals("Alex", viewModel.state.value.profile?.firstName)
        assertEquals("Profile updated", viewModel.state.value.successMessage)
        assertFalse(viewModel.state.value.isSaving)
    }

    @Test
    fun `updateProfileFields failure — sets error`() = runTest {
        coEvery { repository.updateProfileMultipart(any()) } returns Result.failure(Exception("Save failed"))

        viewModel.updateProfileFields(mapOf("firstName" to "Alex"))
        advanceUntilIdle()

        assertEquals("Save failed", viewModel.state.value.error)
        assertFalse(viewModel.state.value.isSaving)
    }

    // ─── updateUsername ────────────────────────────────────────────────────────

    @Test
    fun `updateUsername success — sets successMessage`() = runTest {
        val updated = fakeProfile().copy(username = "newjustin")
        coEvery { repository.updateUsername("newjustin") } returns Result.success(updated)

        viewModel.updateUsername("newjustin")
        advanceUntilIdle()

        assertEquals("Username updated", viewModel.state.value.successMessage)
    }

    @Test
    fun `updateUsername 409 conflict — shows taken message`() = runTest {
        coEvery { repository.updateUsername(any()) } returns Result.failure(Exception("409 Username already taken"))

        viewModel.updateUsername("takenuser")
        advanceUntilIdle()

        assertEquals("Username is already taken", viewModel.state.value.error)
    }

    // ─── changePassword ────────────────────────────────────────────────────────

    @Test
    fun `changePassword success — sets successMessage`() = runTest {
        coEvery { repository.changePassword("old", "new") } returns Result.success(Unit)

        viewModel.changePassword("old", "new")
        advanceUntilIdle()

        assertEquals("Password changed", viewModel.state.value.successMessage)
    }

    // ─── logoutAll ─────────────────────────────────────────────────────────────

    @Test
    fun `logoutAll clears tokens and invokes callback`() = runTest {
        coEvery { repository.logoutAll() } returns Result.success(Unit)

        var called = false
        viewModel.logoutAll { called = true }
        advanceUntilIdle()

        assertTrue(called)
        verify { tokenManager.clearTokens() }
    }

    // ─── deleteAccount ─────────────────────────────────────────────────────────

    @Test
    fun `deleteAccount success — clears tokens and invokes callback`() = runTest {
        coEvery { repository.deleteAccount() } returns Result.success(Unit)

        var called = false
        viewModel.deleteAccount { called = true }
        advanceUntilIdle()

        assertTrue(called)
        verify { tokenManager.clearTokens() }
    }

    @Test
    fun `deleteAccount failure — sets error`() = runTest {
        coEvery { repository.deleteAccount() } returns Result.failure(Exception("Failed"))

        viewModel.deleteAccount {}
        advanceUntilIdle()

        assertEquals("Failed", viewModel.state.value.error)
    }

    // ─── restoreAccount ────────────────────────────────────────────────────────

    @Test
    fun `restoreAccount success — sets successMessage`() = runTest {
        coEvery { repository.restoreAccount() } returns Result.success(fakeProfile())

        viewModel.restoreAccount()
        advanceUntilIdle()

        assertEquals("Account restored", viewModel.state.value.successMessage)
    }

    // ─── clearMessage ──────────────────────────────────────────────────────────

    @Test
    fun `clearMessage resets successMessage and error to null`() = runTest {
        coEvery { repository.updateProfileMultipart(any()) } returns Result.success(fakeProfile())
        viewModel.updateProfileFields(mapOf("firstName" to "X"))
        advanceUntilIdle()

        viewModel.clearMessage()

        assertNull(viewModel.state.value.successMessage)
        assertNull(viewModel.state.value.error)
    }

    // ─── logout ────────────────────────────────────────────────────────────────

    @Test
    fun `logout clears tokens and invokes callback`() {
        var called = false
        viewModel.logout { called = true }

        assertTrue(called)
        verify { tokenManager.clearTokens() }
    }

    // ─── revokeSession ─────────────────────────────────────────────────────────

    @Test
    fun `revokeSession calls repository then reloads sessions`() = runTest {
        coEvery { repository.revokeSession("s1") } returns Result.success(Unit)
        coEvery { repository.getSessions() } returns Result.success(emptyList())

        viewModel.revokeSession("s1")
        advanceUntilIdle()

        coVerify { repository.revokeSession("s1") }
        coVerify { repository.getSessions() }
    }
}
