package com.continuum.android.feature.onboarding.presentation

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.onboarding.presentation.steps.*
import com.continuum.android.feature.profile.data.repository.ProfileRepository

// 5 profile steps (always) + 1 activation = 6 display steps for fresh onboarding
private const val PROFILE_STEP_COUNT = 5

@Composable
fun OnboardingScreen(
    onFinished: () -> Unit,
    onNavigateToSection: (sectionKey: String) -> Unit,
    profileRepository: ProfileRepository,
    apiBaseUrl: String = "",
    viewModel: OnboardingViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    // Goal is needed to show the right ActivationStep config; update when GoalStep saves one.
    var currentGoal by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(Unit) {
        currentGoal = profileRepository.getProfile().getOrNull()?.onboardingGoal
    }

    val showActivation = !state.isReplay && state.isTourPhase
    val totalDisplaySteps = when {
        state.isReplay -> state.totalSteps
        else -> PROFILE_STEP_COUNT + 1
    }
    val displayStepNumber = when {
        state.isReplay -> state.stepNumber
        showActivation || state.isDone -> PROFILE_STEP_COUNT + 1
        else -> minOf(state.stepNumber, PROFILE_STEP_COUNT)
    }
    val progress = displayStepNumber.toFloat() / totalDisplaySteps.toFloat()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .systemBarsPadding()
    ) {
        // ── Hero section (25%) ──────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.25f)
                .background(Brush.verticalGradient(listOf(DeepPurple, BrandPurple))),
            contentAlignment = Alignment.Center,
        ) {
            if (state.isLoading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(36.dp))
            } else {
                HeroContent(state = state, showActivation = showActivation)
            }
        }

        // ── Content section (75%) ───────────────────────────────────────
        val scrollState = rememberScrollState()
        val showScrollHint by remember { derivedStateOf { scrollState.canScrollForward } }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(0.75f)
                .background(PageBackground),
        ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .padding(horizontal = 24.dp, vertical = 20.dp)
                .imePadding()
        ) {
            if (!state.isLoading) {
                // Progress header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        // Back button — profile steps only, after the first step
                        if (state.currentIndex > 0 && state.isProfilePhase) {
                            TextButton(
                                onClick = { viewModel.goBack() },
                                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp),
                            ) {
                                Text("← Back", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                            }
                        }
                        Text(
                            text = if (showActivation || state.isDone) "Almost done"
                                   else "Step $displayStepNumber of $totalDisplaySteps",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted,
                        )
                    }
                    TextButton(
                        onClick = { viewModel.exitAll { onFinished() } },
                        contentPadding = PaddingValues(horizontal = 4.dp, vertical = 2.dp),
                    ) {
                        Text("Skip setup", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                    }
                }
                Spacer(Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth(),
                    color = BrandPurple,
                    trackColor = BrandPurple.copy(alpha = 0.15f),
                )
                Spacer(Modifier.height(24.dp))

                // Step content
                AnimatedContent(
                    targetState = state.currentIndex,
                    transitionSpec = {
                        slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
                    },
                    label = "OnboardingStep",
                ) { index ->
                    val step = state.steps.getOrNull(index) ?: return@AnimatedContent
                    Box(modifier = Modifier.fillMaxWidth()) {
                        when (step) {
                            is OnboardingStep.ProfileStep -> ProfileStepContent(
                                key = step.key,
                                state = state,
                                profileRepository = profileRepository,
                                apiBaseUrl = apiBaseUrl,
                                onAdvance = { viewModel.advance() },
                                onSkip = { viewModel.skip() },
                                onGoalSaved = { goal ->
                                    viewModel.onGoalSaved(goal)
                                    currentGoal = goal
                                },
                            )
                            // Replay tours now use TourOverlay in AppNavHost — OnboardingScreen
                            // is only reached for fresh onboarding, so always show ActivationStep.
                            is OnboardingStep.TourStep -> ActivationStep(
                                goal = currentGoal,
                                onGo = { sectionKey ->
                                    viewModel.completeTour { onNavigateToSection(sectionKey) }
                                },
                                onSkip = { viewModel.completeTour { onFinished() } },
                            )
                            is OnboardingStep.Done -> DoneSlide(
                                isReplay = state.isReplay,
                                onFinish = { viewModel.completeTour { onFinished() } },
                            )
                        }
                    }
                }
            }
        }

        // Scroll hint — fade + chevron when more content is below
        if (showScrollHint) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(56.dp)
                    .background(
                        Brush.verticalGradient(listOf(Color.Transparent, PageBackground))
                    ),
                contentAlignment = Alignment.BottomCenter,
            ) {
                Icon(
                    imageVector = Icons.Filled.KeyboardArrowDown,
                    contentDescription = "Scroll for more",
                    tint = TextMuted,
                    modifier = Modifier.padding(bottom = 6.dp).size(20.dp),
                )
            }
        }
        } // end content Box
    }
}

@Composable
private fun HeroContent(state: OnboardingUiState, showActivation: Boolean) {
    val currentStep = state.currentStep
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.padding(24.dp),
    ) {
        when {
            showActivation || state.isDone -> {
                HeroEmojiCircle("🚀")
                Spacer(Modifier.height(16.dp))
                Text("One last thing.", fontFamily = FrauncesFamily, fontWeight = FontWeight.Bold, fontSize = 22.sp, color = Color.White)
            }
            currentStep is OnboardingStep.TourStep -> {
                // Replay: show section name as hero text
                Text(
                    currentStep.config.sectionName,
                    fontFamily = FrauncesFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 28.sp,
                    color = Color.White,
                )
            }
            currentStep is OnboardingStep.ProfileStep -> {
                HeroEmojiCircle(profileStepEmoji(currentStep.key))
                Spacer(Modifier.height(16.dp))
                Text(profileStepHeadline(currentStep.key), fontFamily = FrauncesFamily, fontWeight = FontWeight.Bold, fontSize = 22.sp, color = Color.White)
            }
            else -> HeroEmojiCircle("✨")
        }
    }
}

@Composable
private fun HeroEmojiCircle(emoji: String) {
    Box(
        modifier = Modifier
            .size(80.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.15f)),
        contentAlignment = Alignment.Center,
    ) {
        Text(emoji, fontSize = 36.sp)
    }
}

private fun profileStepEmoji(key: String): String = when (key) {
    "welcome"      -> "👋"
    "goal"         -> "🎯"
    "name"         -> "✏️"
    "photo-bio"    -> "📷"
    "integrations" -> "🔗"
    else           -> "✨"
}

private fun profileStepHeadline(key: String): String = when (key) {
    "welcome"      -> "You're in."
    "goal"         -> "What matters to you?"
    "name"         -> "Make it yours."
    "photo-bio"    -> "Put a face to it."
    "integrations" -> "Connect your tools."
    else           -> ""
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
    when (key) {
        "welcome" -> WelcomeStep(onContinue = onAdvance)
        "goal"    -> GoalStep(
            profileRepository = profileRepository,
            onContinue = { goal ->
                if (goal != null) onGoalSaved(goal)
                onAdvance()
            },
            onSkip = onSkip,
        )
        "name", "photo-bio", "integrations" -> {
            var loadedProfile by remember { mutableStateOf<com.continuum.android.feature.profile.domain.Profile?>(null) }
            LaunchedEffect(key) {
                loadedProfile = profileRepository.getProfile().getOrNull()
            }
            loadedProfile?.let { p ->
                when (key) {
                    "name"         -> NameStep(profile = p, profileRepository = profileRepository, onContinue = onAdvance, onSkip = onSkip)
                    "photo-bio"    -> PhotoBioStep(profile = p, profileRepository = profileRepository, onContinue = onAdvance, onSkip = onSkip)
                    "integrations" -> IntegrationsStep(profile = p, profileRepository = profileRepository, apiBaseUrl = apiBaseUrl, onContinue = onAdvance, onSkip = onSkip)
                }
            } ?: Box(Modifier.fillMaxWidth().height(120.dp), Alignment.Center) {
                CircularProgressIndicator(color = BrandPurple)
            }
        }
    }
}
