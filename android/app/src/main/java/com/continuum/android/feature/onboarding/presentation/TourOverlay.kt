package com.continuum.android.feature.onboarding.presentation

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.onboarding.TourStepConfig
import com.continuum.android.feature.onboarding.getOrderedTourSteps

private fun sectionRoute(id: String, navRoutes: TourNavRoutes): String? = when (id) {
    "dashboard"    -> navRoutes.dashboard
    "notes"        -> navRoutes.notes
    "flashcards"   -> navRoutes.flashcards
    "tasks"        -> navRoutes.tasks
    "calendar"     -> navRoutes.calendar
    "applications" -> navRoutes.applications
    "resumes"      -> navRoutes.resumes
    "messages"     -> navRoutes.messages
    "friends"      -> navRoutes.friends
    "activity"     -> navRoutes.activity
    "profile"      -> navRoutes.profile
    else           -> null
}

data class TourNavRoutes(
    val dashboard: String,
    val notes: String,
    val flashcards: String,
    val tasks: String,
    val calendar: String,
    val applications: String,
    val resumes: String,
    val messages: String,
    val friends: String,
    val activity: String,
    val profile: String,
)

@Composable
fun TourOverlay(
    navController: NavHostController,
    navRoutes: TourNavRoutes,
    onComplete: () -> Unit,
) {
    val steps = remember { getOrderedTourSteps(null) }
    var stepIndex by remember { mutableIntStateOf(0) }

    val currentStep = steps.getOrNull(stepIndex) ?: run {
        LaunchedEffect(Unit) { onComplete() }
        return
    }

    LaunchedEffect(stepIndex) {
        val route = sectionRoute(currentStep.id, navRoutes) ?: return@LaunchedEffect
        navController.navigate(route) {
            launchSingleTop = true
            restoreState = true
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Dimmed backdrop — blocks page interaction while tour is active
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.4f))
                .clickable(enabled = false, onClick = {}),
        )

        // Full-width card at the bottom — slides in/out on step change
        AnimatedContent(
            targetState = stepIndex,
            transitionSpec = {
                (fadeIn() + slideInVertically { it / 3 }) togetherWith
                (fadeOut() + slideOutVertically { it / 3 })
            },
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth(),
            label = "TourCard",
        ) { idx ->
            val step = steps.getOrNull(idx) ?: return@AnimatedContent
            TourCard(
                step = step,
                stepIndex = idx,
                totalSteps = steps.size,
                onNext = { stepIndex = minOf(stepIndex + 1, steps.size) },
                onBack = { if (stepIndex > 0) stepIndex-- },
                onSkip = onComplete,
            )
        }
    }
}

@Composable
private fun TourCard(
    step: TourStepConfig,
    stepIndex: Int,
    totalSteps: Int,
    onNext: () -> Unit,
    onBack: () -> Unit,
    onSkip: () -> Unit,
) {
    // Full-width surface — round top corners only, flush against bottom edge
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp),
        color = White,
        shadowElevation = 16.dp,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
        ) {
            // Purple header bar
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(DeepPurple)
                    .padding(horizontal = 20.dp, vertical = 16.dp),
            ) {
                Text(
                    text = "${stepIndex + 1} of $totalSteps  •  ${step.sectionName.uppercase()}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White.copy(alpha = 0.6f),
                    letterSpacing = 1.sp,
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = step.heading,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    lineHeight = 24.sp,
                )
            }

            // Body
            Column(modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp)) {
                Text(
                    text = step.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    lineHeight = 22.sp,
                )
                Spacer(Modifier.height(20.dp))

                // Back / Next row
                Row(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (stepIndex > 0) {
                        OutlinedButton(
                            onClick = onBack,
                            modifier = Modifier.wrapContentWidth(),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandPurple),
                        ) {
                            Text("← Back", fontWeight = FontWeight.SemiBold)
                        }
                    }
                    Button(
                        onClick = onNext,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = BrandPurple),
                        shape = RoundedCornerShape(10.dp),
                    ) {
                        Text("Next", fontWeight = FontWeight.SemiBold)
                    }
                }

                Spacer(Modifier.height(4.dp))
                TextButton(
                    onClick = onSkip,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Skip tour", color = TextMuted)
                }
            }
        }
    }
}
