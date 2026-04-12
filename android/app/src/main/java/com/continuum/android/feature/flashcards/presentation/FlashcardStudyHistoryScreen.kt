package com.continuum.android.feature.flashcards.presentation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import com.continuum.android.core.ui.LocalNetworkMonitor
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.flashcards.data.repository.FlashcardsRepository

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlashcardStudyHistoryScreen(
    onNavigateBack: () -> Unit,
    onOpenSet: (String) -> Unit = {},
    viewModel: FlashcardsViewModel = hiltViewModel()
) {
    val state by viewModel.historyState.collectAsStateWithLifecycle()
    val networkMonitor = LocalNetworkMonitor.current
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)

    LaunchedEffect(Unit) { viewModel.loadStudyHistory() }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = "Study history",
                onNavigateBack = onNavigateBack
            )
        },
        containerColor = PageBackground
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (!isOnline) OfflineBanner()

            PullToRefreshBox(
                isRefreshing = state.isLoading && state.sessions.isNotEmpty(),
                onRefresh = { viewModel.loadStudyHistory() },
                modifier = Modifier.weight(1f)
            ) {
                when {
                    state.isLoading && state.sessions.isEmpty() -> {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            items(6) {
                                SkeletonLoader(modifier = Modifier.fillMaxWidth().height(72.dp))
                            }
                        }
                    }

                    state.error != null && state.sessions.isEmpty() -> {
                        EmptyState(
                            icon = Icons.Default.History,
                            headline = "Could not load history",
                            subtext = state.error ?: "",
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    state.sessions.isEmpty() -> {
                        EmptyState(
                            icon = Icons.Default.History,
                            headline = "No study sessions yet",
                            subtext = "Complete a study round to see it here.",
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    else -> {
                        LazyColumn(
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            item {
                                SummaryRow(
                                    streak = state.streak,
                                    sessionCount = state.sessions.size,
                                    sessions = state.sessions
                                )
                            }
                            items(state.sessions, key = { it.id }) { session ->
                                FlashcardStudySessionRow(
                                    session = session,
                                    titleLine = "Set ${session.setId.takeLast(8)}",
                                    subtitleLine = "${session.correctCount}/${session.totalCards} correct · " +
                                        "${formatStudySessionDuration(session.durationSeconds)} · " +
                                        session.completedAt.take(10),
                                    onOpenSetClick = { onOpenSet(session.setId) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SummaryRow(
    streak: Int,
    sessionCount: Int,
    sessions: List<FlashcardsRepository.StudySession>
) {
    val avgScore = if (sessions.isNotEmpty()) {
        sessions.map { it.score }.average().toInt()
    } else {
        null
    }
    val totalCards = sessions.sumOf { it.totalCards }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        if (streak >= 1) {
            Surface(
                color = if (streak >= 7) WarningAmber.copy(alpha = 0.15f) else PurpleTint,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.weight(1f)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(
                        "$streak",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text("day streak", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                }
            }
        }
        Surface(
            color = White,
            shape = RoundedCornerShape(14.dp),
            border = BorderStroke(1.dp, Border),
            modifier = Modifier.weight(1f)
        ) {
            Column(Modifier.padding(14.dp)) {
                Text(
                    "$sessionCount",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text("sessions (this page)", style = MaterialTheme.typography.labelSmall, color = TextMuted)
            }
        }
        if (avgScore != null) {
            Surface(
                color = White,
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, Border),
                modifier = Modifier.weight(1f)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(
                        "$avgScore%",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text("avg score", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                }
            }
        }
        if (totalCards > 0) {
            Surface(
                color = White,
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, Border),
                modifier = Modifier.weight(1f)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Text(
                        "$totalCards",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text("cards studied", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                }
            }
        }
    }
}

