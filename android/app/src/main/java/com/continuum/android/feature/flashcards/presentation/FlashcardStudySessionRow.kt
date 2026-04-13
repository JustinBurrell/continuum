package com.continuum.android.feature.flashcards.presentation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.SkeletonLoader
import com.continuum.android.core.ui.theme.Border
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.ErrorRed
import com.continuum.android.core.ui.theme.ErrorRedBg
import com.continuum.android.core.ui.theme.PurpleTint
import com.continuum.android.core.ui.theme.SuccessGreen
import com.continuum.android.core.ui.theme.SuccessGreenBg
import com.continuum.android.core.ui.theme.TextMuted
import com.continuum.android.core.ui.theme.TextPrimary
import com.continuum.android.core.ui.theme.TextSecondary
import com.continuum.android.core.ui.theme.White
import com.continuum.android.feature.flashcards.data.repository.FlashcardsRepository

@Composable
fun FlashcardStudySessionRow(
    session: FlashcardsRepository.StudySession,
    titleLine: String,
    subtitleLine: String,
    modifier: Modifier = Modifier,
    onOpenSetClick: (() -> Unit)? = null,
    viewModel: FlashcardsViewModel = hiltViewModel()
) {
    var expanded by remember(session.id) { mutableStateOf(false) }
    val detailMap by viewModel.sessionDetailCache.collectAsStateWithLifecycle()
    val detail = detailMap[session.id]

    LaunchedEffect(expanded, session.id) {
        if (expanded) viewModel.loadStudySessionDetail(session.id)
    }

    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        color = White,
        border = BorderStroke(1.dp, if (expanded) BrandPurple else Border),
        shadowElevation = 1.dp
    ) {
        Column(Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { expanded = !expanded }
                        .padding(start = 10.dp, top = 10.dp, bottom = 10.dp, end = 4.dp)
                ) {
                    Text(
                        titleLine,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = BrandPurple
                    )
                    Text(
                        subtitleLine,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
                if (onOpenSetClick != null) {
                    IconButton(onClick = onOpenSetClick) {
                        Icon(
                            Icons.AutoMirrored.Filled.OpenInNew,
                            contentDescription = "Open set",
                            tint = TextMuted
                        )
                    }
                }
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (expanded) "Collapse" else "Expand",
                    tint = TextMuted,
                    modifier = Modifier
                        .clickable { expanded = !expanded }
                        .padding(12.dp)
                )
            }

            AnimatedVisibility(visible = expanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(PurpleTint.copy(alpha = 0.45f))
                        .padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    HorizontalDivider(color = Border)
                    when {
                        detail == null || detail.loading -> {
                            repeat(3) {
                                SkeletonLoader(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(44.dp)
                                )
                            }
                        }

                        detail?.error != null -> {
                            Text(
                                detail.error ?: "Could not load details",
                                style = MaterialTheme.typography.bodySmall,
                                color = ErrorRed
                            )
                        }

                        detail?.outcomes.isNullOrEmpty() && detail?.fetchCompleted == true -> {
                            Text(
                                "No card detail available for this session.",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextMuted
                            )
                        }

                        else -> {
                            detail?.outcomes?.forEach { outcome ->
                                StudySessionOutcomeChip(outcome)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StudySessionOutcomeChip(outcome: FlashcardsRepository.StudySessionCardOutcome) {
    val ok = outcome.correct
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = if (ok) SuccessGreenBg else ErrorRedBg,
        border = BorderStroke(1.dp, (if (ok) SuccessGreen else ErrorRed).copy(alpha = 0.35f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = if (ok) Icons.Default.CheckCircle else Icons.Default.Close,
                contentDescription = null,
                tint = if (ok) SuccessGreen else ErrorRed,
                modifier = Modifier.padding(top = 2.dp)
            )
            Column(Modifier.weight(1f)) {
                Text(
                    outcome.front,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = TextPrimary
                )
                if (!outcome.back.isNullOrBlank()) {
                    Text(
                        outcome.back,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }
        }
    }
}

fun formatStudySessionDuration(seconds: Int): String {
    if (seconds <= 0) return "0s"
    val m = seconds / 60
    val s = seconds % 60
    return if (m > 0) "${m}m ${s}s" else "${s}s"
}
