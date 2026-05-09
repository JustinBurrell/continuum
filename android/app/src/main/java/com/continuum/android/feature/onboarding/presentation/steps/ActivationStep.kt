package com.continuum.android.feature.onboarding.presentation.steps

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*

private data class ActivationConfig(
    val headline: String,
    val body: String,
    val cta: String,
    val sectionKey: String,
)

private val GOAL_ACTIVATION = mapOf(
    "study_smarter" to ActivationConfig(
        headline = "Create your first note",
        body = "Rich-text notes with AI summaries — the fastest way to start studying smarter.",
        cta = "Open Notes",
        sectionKey = "notes",
    ),
    "track_job_search" to ActivationConfig(
        headline = "Add your first application",
        body = "Track every job you've applied to and exactly where each one stands.",
        cta = "Open Applications",
        sectionKey = "applications",
    ),
    "manage_coursework" to ActivationConfig(
        headline = "Create your first task",
        body = "A kanban board for every assignment, project, and deadline.",
        cta = "Open Tasks",
        sectionKey = "tasks",
    ),
    "collaborate" to ActivationConfig(
        headline = "Find your first friend",
        body = "Connect with other students and start sharing notes and activity.",
        cta = "Find Friends",
        sectionKey = "friends",
    ),
    "not_sure" to ActivationConfig(
        headline = "Explore Continuum",
        body = "Your dashboard is the bird's-eye view of everything — notes, tasks, flashcards, and more.",
        cta = "Go to Dashboard",
        sectionKey = "dashboard",
    ),
)

@Composable
fun ActivationStep(
    goal: String?,
    onGo: (sectionKey: String) -> Unit,
    onSkip: () -> Unit,
) {
    val config = GOAL_ACTIVATION[goal] ?: GOAL_ACTIVATION["not_sure"]!!

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            config.headline,
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            config.body,
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
        )
        Spacer(Modifier.height(32.dp))
        ContinuumButton(
            text = config.cta,
            onClick = { onGo(config.sectionKey) },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) {
            Text("Skip to dashboard", color = TextMuted)
        }
    }
}
