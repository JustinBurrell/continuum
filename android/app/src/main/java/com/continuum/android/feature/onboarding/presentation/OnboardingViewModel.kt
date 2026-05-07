package com.continuum.android.feature.onboarding.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.feature.onboarding.TourStepConfig
import com.continuum.android.feature.onboarding.getOrderedTourSteps
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

// Flat step descriptors — profile setup steps, tour steps, and the done sentinel.
sealed class OnboardingStep {
    data class ProfileStep(val key: String) : OnboardingStep()
    data class TourStep(val config: TourStepConfig, val tourIndex: Int) : OnboardingStep()
    object Done : OnboardingStep()
}

data class OnboardingUiState(
    val isLoading: Boolean = true,
    val steps: List<OnboardingStep> = emptyList(),
    val currentIndex: Int = 0,
    val isReplay: Boolean = false,
    val stepsCompleted: Int = 0,
    val stepsSkipped: Int = 0,
    val error: String? = null,
) {
    val currentStep: OnboardingStep? get() = steps.getOrNull(currentIndex)
    // Total excludes the Done sentinel
    val totalSteps: Int get() = maxOf(steps.size - 1, 1)
    val stepNumber: Int get() = currentIndex + 1
    val isDone: Boolean get() = currentStep is OnboardingStep.Done
    val isProfilePhase: Boolean get() = currentStep is OnboardingStep.ProfileStep
    val isTourPhase: Boolean get() = currentStep is OnboardingStep.TourStep
}

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val profileRepository: ProfileRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(OnboardingUiState())
    val state: StateFlow<OnboardingUiState> = _state.asStateFlow()

    // Track whether onboarding/complete has been fired this session
    private var onboardingCompleteFired = false

    init {
        loadAndInit()
    }

    private fun loadAndInit() {
        viewModelScope.launch {
            val profile = profileRepository.getProfile().getOrNull()
            val isReplay = profile?.onboardingCompleted == true
            onboardingCompleteFired = isReplay
            val steps = computeSteps(profile, isReplay)
            _state.update { it.copy(isLoading = false, steps = steps, isReplay = isReplay) }
        }
    }

    private fun computeSteps(profile: Profile?, isReplay: Boolean): List<OnboardingStep> {
        val steps = mutableListOf<OnboardingStep>()
        if (!isReplay) {
            steps += OnboardingStep.ProfileStep("welcome")
            steps += OnboardingStep.ProfileStep("goal")
            // Name step only for Google-linked users (auto-generated username)
            if (profile?.isGoogleLinked == true) {
                steps += OnboardingStep.ProfileStep("name")
            }
            steps += OnboardingStep.ProfileStep("photo-bio")
            steps += OnboardingStep.ProfileStep("social-links")
            // Google Drive step only for non-Google users
            if (profile?.isGoogleLinked != true) {
                steps += OnboardingStep.ProfileStep("google-drive")
            }
        }
        getOrderedTourSteps(profile?.onboardingGoal).forEachIndexed { index, config ->
            steps += OnboardingStep.TourStep(config, index)
        }
        steps += OnboardingStep.Done
        return steps
    }

    // Synchronous advance — state updates immediately, API calls are fire-and-forget.
    fun advance() {
        val s = _state.value
        val current = s.currentStep
        val next = s.steps.getOrNull(s.currentIndex + 1)

        // Fire onboarding/complete once at the profile → tour boundary
        if (!onboardingCompleteFired && current is OnboardingStep.ProfileStep && next is OnboardingStep.TourStep) {
            onboardingCompleteFired = true
            viewModelScope.launch { runCatching { profileRepository.completeOnboarding() } }
        }

        _state.update {
            it.copy(
                currentIndex = minOf(it.currentIndex + 1, it.steps.size - 1),
                stepsCompleted = it.stepsCompleted + 1,
            )
        }
    }

    fun skip() {
        val s = _state.value
        val current = s.currentStep
        val next = s.steps.getOrNull(s.currentIndex + 1)

        if (!onboardingCompleteFired && current is OnboardingStep.ProfileStep && next is OnboardingStep.TourStep) {
            onboardingCompleteFired = true
            viewModelScope.launch { runCatching { profileRepository.completeOnboarding() } }
        }

        _state.update {
            it.copy(
                currentIndex = minOf(it.currentIndex + 1, it.steps.size - 1),
                stepsSkipped = it.stepsSkipped + 1,
            )
        }
    }

    fun completeTour(onDone: () -> Unit) {
        viewModelScope.launch {
            runCatching { profileRepository.completeTour() }
            onDone()
        }
    }

    fun exitAll(onDone: () -> Unit) {
        viewModelScope.launch {
            if (!onboardingCompleteFired) {
                runCatching { profileRepository.completeOnboarding() }
            }
            runCatching { profileRepository.completeTour() }
            onDone()
        }
    }

    // Called from GoalStep after successful API save
    fun onGoalSaved(goal: String) {
        _state.update { it.copy(steps = computeStepsWithGoal(goal, it)) }
    }

    private fun computeStepsWithGoal(goal: String, current: OnboardingUiState): List<OnboardingStep> {
        // Rebuild only the tour section of the step list with the new goal order,
        // preserving the current position and profile steps.
        val profileSteps = current.steps.filterIsInstance<OnboardingStep.ProfileStep>()
        val tourSteps = getOrderedTourSteps(goal).mapIndexed { i, cfg -> OnboardingStep.TourStep(cfg, i) }
        return profileSteps + tourSteps + OnboardingStep.Done
    }
}
