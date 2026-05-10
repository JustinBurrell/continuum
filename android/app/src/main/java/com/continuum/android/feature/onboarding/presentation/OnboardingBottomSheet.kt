package com.continuum.android.feature.onboarding.presentation

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.onboarding.presentation.steps.*
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import javax.inject.Inject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnboardingBottomSheet(
    onDismiss: () -> Unit,
    profileRepository: ProfileRepository,
    apiBaseUrl: String = "",
    viewModel: OnboardingViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Intercept drag-to-dismiss — fire exitAll instead of silently closing
    ModalBottomSheet(
        onDismissRequest = {
            viewModel.exitAll { onDismiss() }
        },
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface,
        dragHandle = null, // custom header replaces the drag handle
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .imePadding()
        ) {
            if (state.isLoading) {
                Box(
                    modifier = Modifier.fillMaxWidth().height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = BrandPurple)
                }
                return@ModalBottomSheet
            }

            // Header: progress indicator + step counter + X button
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp).padding(top = 16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (!state.isDone) {
                        Text(
                            "Step ${state.stepNumber} of ${state.totalSteps}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted,
                        )
                    } else {
                        Spacer(Modifier.width(1.dp))
                    }
                    IconButton(
                        onClick = { viewModel.exitAll { onDismiss() } },
                        modifier = Modifier.size(28.dp),
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Exit onboarding", tint = TextMuted)
                    }
                }

                if (!state.isDone) {
                    Spacer(Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { state.currentIndex.toFloat() / state.totalSteps.toFloat() },
                        modifier = Modifier.fillMaxWidth(),
                        color = BrandPurple,
                        trackColor = BrandPurple.copy(alpha = 0.15f),
                    )
                }
            }

            Spacer(Modifier.height(4.dp))

            // Step content — keyed by index so AnimatedContent slides on each change
            AnimatedContent(
                targetState = state.currentIndex,
                transitionSpec = {
                    slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
                },
                label = "OnboardingStep",
            ) { index ->
                val step = state.steps.getOrNull(index) ?: return@AnimatedContent

                Box(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 16.dp)) {
                    when (step) {
                        is OnboardingStep.ProfileStep -> ProfileStepContent(
                            key = step.key,
                            state = state,
                            profileRepository = profileRepository,
                            apiBaseUrl = apiBaseUrl,
                            onAdvance = { viewModel.advance() },
                            onSkip = { viewModel.skip() },
                            onGoalSaved = { viewModel.onGoalSaved(it) },
                        )
                        is OnboardingStep.TourStep -> TourStepContent(
                            config = step.config,
                            onNext = { viewModel.advance() },
                            onSkipTour = { viewModel.completeTour { onDismiss() } },
                        )
                        is OnboardingStep.Done -> DoneSlide(
                            isReplay = state.isReplay,
                            onFinish = { viewModel.completeTour { onDismiss() } },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileStepContent(
    key: String,
    state: OnboardingUiState,
    profileRepository: ProfileRepository,
    apiBaseUrl: String,
    onAdvance: () -> Unit,
    onSkip: () -> Unit,
    onGoalSaved: (String) -> Unit,
) {
    // Load profile lazily from state — the ViewModel pre-fetches it so it's available
    val profile = remember(state) {
        // Extract from current steps' context — we access it via a coroutine if needed.
        // For composables that need profile, we pass profileRepository directly so they
        // can re-read as needed. Profile is available from profileRepository's cache.
        null // steps that need it fetch it themselves via profileRepository
    }

    when (key) {
        "welcome"      -> WelcomeStep(onContinue = onAdvance)
        "goal"         -> GoalStep(
            profileRepository = profileRepository,
            onContinue = { goal ->
                if (goal != null) onGoalSaved(goal)
                onAdvance()
            },
            onSkip = onSkip,
        )
        "name"         -> {
            // Name step needs the current profile — load it inline
            var loadedProfile by remember { mutableStateOf<com.continuum.android.feature.profile.domain.Profile?>(null) }
            LaunchedEffect(Unit) {
                loadedProfile = profileRepository.getProfile().getOrNull()
            }
            loadedProfile?.let { p ->
                NameStep(
                    profile = p,
                    profileRepository = profileRepository,
                    onContinue = onAdvance,
                    onSkip = onSkip,
                )
            } ?: Box(Modifier.fillMaxWidth().height(120.dp), Alignment.Center) {
                CircularProgressIndicator(color = BrandPurple)
            }
        }
        "photo-bio"    -> {
            var loadedProfile by remember { mutableStateOf<com.continuum.android.feature.profile.domain.Profile?>(null) }
            LaunchedEffect(Unit) {
                loadedProfile = profileRepository.getProfile().getOrNull()
            }
            loadedProfile?.let { p ->
                PhotoBioStep(
                    profile = p,
                    profileRepository = profileRepository,
                    onContinue = onAdvance,
                    onSkip = onSkip,
                )
            } ?: Box(Modifier.fillMaxWidth().height(120.dp), Alignment.Center) {
                CircularProgressIndicator(color = BrandPurple)
            }
        }
        "social-links" -> {
            var loadedProfile by remember { mutableStateOf<com.continuum.android.feature.profile.domain.Profile?>(null) }
            LaunchedEffect(Unit) {
                loadedProfile = profileRepository.getProfile().getOrNull()
            }
            loadedProfile?.let { p ->
                SocialLinksStep(
                    profile = p,
                    profileRepository = profileRepository,
                    onContinue = onAdvance,
                    onSkip = onSkip,
                )
            } ?: Box(Modifier.fillMaxWidth().height(120.dp), Alignment.Center) {
                CircularProgressIndicator(color = BrandPurple)
            }
        }
        "google-drive" -> {
            var loadedProfile by remember { mutableStateOf<com.continuum.android.feature.profile.domain.Profile?>(null) }
            LaunchedEffect(Unit) {
                loadedProfile = profileRepository.getProfile().getOrNull()
            }
            loadedProfile?.let { p ->
                GoogleDriveStep(
                    profile = p,
                    profileRepository = profileRepository,
                    apiBaseUrl = apiBaseUrl,
                    onContinue = onAdvance,
                    onSkip = onSkip,
                )
            } ?: Box(Modifier.fillMaxWidth().height(120.dp), Alignment.Center) {
                CircularProgressIndicator(color = BrandPurple)
            }
        }
    }
}
