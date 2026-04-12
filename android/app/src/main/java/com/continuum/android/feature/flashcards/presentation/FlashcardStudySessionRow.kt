package com.continuum.android.feature.flashcards.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.components.ContinuumCard
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.TextMuted
import com.continuum.android.core.ui.theme.TextSecondary
import com.continuum.android.feature.flashcards.data.repository.FlashcardsRepository

@Composable
fun FlashcardStudySessionRow(
    session: FlashcardsRepository.StudySession,
    titleLine: String,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    val cardModifier = if (onClick != null) {
        modifier.fillMaxWidth().clickable(onClick = onClick)
    } else {
        modifier.fillMaxWidth()
    }
    ContinuumCard(modifier = cardModifier) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    titleLine,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = BrandPurple
                )
                Text(
                    session.completedAt.take(10),
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )
            }
            Text(
                "${session.score}% score · ${session.totalCards} cards · ${formatStudySessionDuration(session.durationSeconds)} · ${session.correctCount} correct",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }
    }
}

fun formatStudySessionDuration(seconds: Int): String {
    if (seconds <= 0) return "0s"
    val m = seconds / 60
    val s = seconds % 60
    return if (m > 0) "${m}m ${s}s" else "${s}s"
}
