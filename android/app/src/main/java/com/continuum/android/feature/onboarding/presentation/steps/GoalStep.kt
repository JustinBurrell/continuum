package com.continuum.android.feature.onboarding.presentation.steps

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import kotlinx.coroutines.launch
import javax.inject.Inject

private data class GoalOption(val value: String, val label: String, val subtitle: String)

private val GOALS = listOf(
    GoalOption("study_smarter",    "Study smarter",            "Notes, flashcards, AI summaries"),
    GoalOption("track_job_search", "Track my job search",      "Applications, resume"),
    GoalOption("manage_coursework","Manage my coursework",      "Tasks, calendar"),
    GoalOption("collaborate",      "Collaborate with friends",  "Sharing, social feed"),
    GoalOption("not_sure",         "Not sure, show me everything", ""),
)

@Composable
fun GoalStep(
    profileRepository: ProfileRepository,
    onContinue: (selectedGoal: String?) -> Unit,
    onSkip: () -> Unit,
) {
    var selected by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    // Pre-select previously saved goal if user is returning to onboarding
    LaunchedEffect(Unit) {
        val savedGoal = profileRepository.getProfile().getOrNull()?.onboardingGoal
        if (selected == null && savedGoal != null) selected = savedGoal
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            "What brought you to Continuum?",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "We'll personalize your tour based on your answer.",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
        )
        Spacer(Modifier.height(16.dp))

        GOALS.forEach { goal ->
            val isSelected = selected == goal.value
            Surface(
                onClick = { selected = goal.value; error = null },
                shape = RoundedCornerShape(8.dp),
                color = if (isSelected) BrandPurple.copy(alpha = 0.06f) else White,
                border = BorderStroke(
                    width = if (isSelected) 2.dp else 1.dp,
                    color = if (isSelected) BrandPurple else Border,
                ),
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            ) {
                Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                    Text(
                        goal.label,
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (isSelected) BrandPurple else TextPrimary,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                    )
                    if (goal.subtitle.isNotEmpty()) {
                        Text(
                            goal.subtitle,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMuted,
                        )
                    }
                }
            }
        }

        error?.let {
            Spacer(Modifier.height(4.dp))
            Text(it, style = MaterialTheme.typography.bodySmall, color = ErrorRed)
        }

        Spacer(Modifier.height(8.dp))
        ContinuumButton(
            text = if (loading) "Saving…" else "Continue",
            enabled = !loading,
            loading = loading,
            onClick = {
                if (selected == null) { onContinue(null); return@ContinuumButton }
                loading = true
                scope.launch {
                    val result = profileRepository.updateOnboardingGoal(selected!!)
                    loading = false
                    if (result.isSuccess) {
                        onContinue(selected)
                    } else {
                        error = "Something went wrong. Please try again."
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) {
            Text("Skip", color = TextMuted)
        }
    }
}
