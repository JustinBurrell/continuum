package com.continuum.android.feature.onboarding.presentation.steps

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.onboarding.presentation.signalFirstRun

private data class ActivationConfig(
    val headline: String,
    val body: String,
    val cta: String,
    val sectionKey: String,
)

private val GOAL_ACTIVATION = mapOf(
    "study_smarter" to ActivationConfig(
        headline = "Create your first note",
        body = "Rich-text notes with AI summaries, the fastest way to start studying smarter.",
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
        headline = "See everything Continuum offers",
        body = "Take a guided tour of every feature: notes, tasks, flashcards, career tools, social, and more.",
        cta = "Start Feature Tour",
        sectionKey = "feature_tour",
    ),
)

@Composable
fun ActivationStep(
    goal: String?,
    onGo: (sectionKey: String) -> Unit,
    onSkip: () -> Unit,
) {
    val config = GOAL_ACTIVATION[goal] ?: GOAL_ACTIVATION["not_sure"]!!
    val context = LocalContext.current

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
            onClick = {
                val isSection = config.sectionKey != "dashboard" && config.sectionKey != "feature_tour"
                if (isSection) signalFirstRun(context, config.sectionKey)
                onGo(config.sectionKey)
            },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) {
            Text("Skip to dashboard", color = TextMuted)
        }
    }
}
