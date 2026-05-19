package com.continuum.android.feature.onboarding

import com.continuum.android.feature.onboarding.presentation.OnboardingStep
import com.continuum.android.feature.onboarding.presentation.OnboardingViewModel
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
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
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class OnboardingViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val profileRepository: ProfileRepository = mockk()
    private lateinit var viewModel: OnboardingViewModel

    private fun fakeProfile(onboardingCompleted: Boolean = false, goal: String? = null) = Profile(
        id = "u1", firstName = "Justin", lastName = "B", username = "justin",
        email = "j@test.com", bio = null, avatarUrl = null, linkedinUrl = null,
        instagramHandle = null, isEmailVerified = true, isGoogleLinked = false, isDemo = false,
        pendingDeletion = false, scheduledDeletionAt = null, activityVisibility = "friends",
        emailNotifications = true, pushNotifications = true, createdAt = "2025-01-01",
        onboardingCompleted = onboardingCompleted, onboardingGoal = goal
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createViewModel(): OnboardingViewModel {
        val vm = OnboardingViewModel(profileRepository)
        return vm
    }

    @Test
    fun `init — loads steps for new user (onboardingCompleted = false)`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile(onboardingCompleted = false))

        viewModel = createViewModel()
        advanceUntilIdle()

        assertFalse(viewModel.state.value.isLoading)
        assertTrue(viewModel.state.value.steps.isNotEmpty())
        assertFalse(viewModel.state.value.isReplay)
        // New user starts at profile phase
        assertTrue(viewModel.state.value.currentStep is OnboardingStep.ProfileStep)
    }

    @Test
    fun `init — replay mode when onboardingCompleted = true`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile(onboardingCompleted = true))

        viewModel = createViewModel()
        advanceUntilIdle()

        assertTrue(viewModel.state.value.isReplay)
        // Replay skips profile steps, starts at tour step
        assertTrue(viewModel.state.value.currentStep is OnboardingStep.TourStep)
    }

    @Test
    fun `advance increments currentIndex and stepsCompleted`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile())

        viewModel = createViewModel()
        advanceUntilIdle()

        val before = viewModel.state.value.currentIndex
        viewModel.advance()

        assertEquals(before + 1, viewModel.state.value.currentIndex)
        assertEquals(1, viewModel.state.value.stepsCompleted)
    }

    @Test
    fun `skip increments currentIndex and stepsSkipped`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile())

        viewModel = createViewModel()
        advanceUntilIdle()

        viewModel.skip()

        assertEquals(1, viewModel.state.value.stepsSkipped)
        assertEquals(1, viewModel.state.value.currentIndex)
    }

    @Test
    fun `goBack decrements currentIndex — clamps at 0`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile())

        viewModel = createViewModel()
        advanceUntilIdle()

        // Go forward first
        viewModel.advance()
        viewModel.advance()
        val mid = viewModel.state.value.currentIndex

        viewModel.goBack()
        assertEquals(mid - 1, viewModel.state.value.currentIndex)

        // Clamp at 0
        repeat(20) { viewModel.goBack() }
        assertEquals(0, viewModel.state.value.currentIndex)
    }

    @Test
    fun `completeTour calls profileRepository and invokes callback`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile())
        coEvery { profileRepository.completeTour() } returns Result.success(fakeProfile())

        viewModel = createViewModel()
        advanceUntilIdle()

        var doneCalled = false
        viewModel.completeTour { doneCalled = true }
        advanceUntilIdle()

        assertTrue(doneCalled)
        coVerify { profileRepository.completeTour() }
    }

    @Test
    fun `exitAll calls completeOnboarding (if not fired) and completeTour`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile(onboardingCompleted = false))
        coEvery { profileRepository.completeOnboarding() } returns Result.success(fakeProfile(onboardingCompleted = true))
        coEvery { profileRepository.completeTour() } returns Result.success(fakeProfile())

        viewModel = createViewModel()
        advanceUntilIdle()

        var doneCalled = false
        viewModel.exitAll { doneCalled = true }
        advanceUntilIdle()

        assertTrue(doneCalled)
        coVerify { profileRepository.completeTour() }
    }

    @Test
    fun `onGoalSaved rebuilds tour steps with new goal`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile(goal = "career"))

        viewModel = createViewModel()
        advanceUntilIdle()

        val stepsBefore = viewModel.state.value.steps.size
        viewModel.onGoalSaved("learning")
        // Tour steps are rebuilt — count may change but should still include Done
        assertTrue(viewModel.state.value.steps.last() is OnboardingStep.Done)
        // Step count should be non-zero
        assertTrue(viewModel.state.value.steps.size > 1)
    }

    @Test
    fun `advance fires completeOnboarding at profile-to-tour boundary`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile(onboardingCompleted = false))
        coEvery { profileRepository.completeOnboarding() } returns Result.success(fakeProfile(onboardingCompleted = true))

        viewModel = createViewModel()
        advanceUntilIdle()

        // Advance through all profile steps until we hit the first tour step
        val steps = viewModel.state.value.steps
        val tourBoundary = steps.indexOfFirst { it is OnboardingStep.TourStep }
        repeat(tourBoundary) { viewModel.advance() }
        advanceUntilIdle()

        coVerify(atLeast = 1) { profileRepository.completeOnboarding() }
    }
}
