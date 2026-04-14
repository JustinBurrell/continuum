package com.continuum.android.feature.career.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.career.domain.ResumeFeedback

@Composable
fun ResumeFeedbackScreen(
    resumeId: String,
    onNavigateBack: () -> Unit,
    viewModel: CareerViewModel = hiltViewModel()
) {
    val state by viewModel.feedbackState.collectAsStateWithLifecycle()

    LaunchedEffect(resumeId) { viewModel.loadFeedback(resumeId) }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = "AI Feedback",
                onNavigateBack = onNavigateBack
            )
        }
    ) { innerPadding ->
        when {
            state.isLoading -> {
                Box(Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = BrandPurple)
                        Spacer(Modifier.height(8.dp))
                        Text("Loading feedback...", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    }
                }
            }

            state.feedback != null -> {
                FeedbackContent(
                    feedback = state.feedback!!,
                    isRegenerating = state.isRegenerating,
                    onRegenerate = { viewModel.regenerateFeedback(resumeId) },
                    modifier = Modifier.fillMaxSize().padding(innerPadding)
                )
            }

            else -> {
                Box(Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.padding(32.dp)
                    ) {
                        Icon(Icons.Default.AutoAwesome, null, tint = BrandPurple, modifier = Modifier.size(48.dp))
                        Text("No feedback yet", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                        Text(
                            "Generate AI feedback to get a detailed analysis of your resume.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                        if (state.error != null) {
                            Text(state.error!!, style = MaterialTheme.typography.bodySmall, color = ErrorRed)
                        }
                        ContinuumButton(
                            text = if (state.isRegenerating) "Analyzing..." else "Generate Feedback",
                            onClick = { viewModel.regenerateFeedback(resumeId) },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !state.isRegenerating
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FeedbackContent(
    feedback: ResumeFeedback,
    isRegenerating: Boolean,
    onRegenerate: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Overall score
        ContinuumCard(modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${feedback.overallScore}",
                        style = MaterialTheme.typography.displayLarge,
                        color = BrandPurple
                    )
                    Text("/100", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    Text("Overall Score", style = MaterialTheme.typography.labelLarge, color = TextPrimary)
                }
            }
        }

        // Score breakdown
        ContinuumCard(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("Score Breakdown", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                listOf(
                    "Experience" to feedback.experience,
                    "Education" to feedback.education,
                    "Skills" to feedback.skills,
                    "Keywords" to feedback.keywords,
                    "Formatting" to feedback.formatting
                ).forEach { (label, score) ->
                    ScoreBar(label = label, score = score)
                }
            }
        }

        // Strengths
        if (feedback.strengths.isNotEmpty()) {
            ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Strengths", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                    feedback.strengths.forEach { strength ->
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.CheckCircle, null, tint = SuccessGreen, modifier = Modifier.size(18.dp))
                            Text(strength, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                        }
                    }
                }
            }
        }

        // Improvements
        if (feedback.improvements.isNotEmpty()) {
            ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Areas to Improve", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                    feedback.improvements.forEach { item ->
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.Warning, null, tint = WarningAmber, modifier = Modifier.size(18.dp))
                            Text(item, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                        }
                    }
                }
            }
        }

        // Keyword gaps
        if (feedback.keywordGaps.isNotEmpty()) {
            ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Keyword Gaps", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                    Text("Consider adding these keywords:", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    feedback.keywordGaps.forEach { keyword ->
                        Text("• $keyword", style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                    }
                }
            }
        }

        // Regenerate button
        ContinuumButton(
            text = if (isRegenerating) "Analyzing..." else "Regenerate Feedback",
            onClick = onRegenerate,
            modifier = Modifier.fillMaxWidth(),
            variant = ContinuumButtonVariant.Secondary,
            enabled = !isRegenerating
        )

        // Footer
        Text(
            "Generated ${feedback.generatedAt.take(10)} · ${feedback.model}",
            style = MaterialTheme.typography.bodySmall,
            color = TextMuted
        )
    }
}

@Composable
private fun ScoreBar(label: String, score: Int) {
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
            Text("$score", style = MaterialTheme.typography.bodyMedium, color = BrandPurple)
        }
        Spacer(Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { score / 100f },
            modifier = Modifier.fillMaxWidth(),
            color = BrandPurple,
            trackColor = Border
        )
    }
}
