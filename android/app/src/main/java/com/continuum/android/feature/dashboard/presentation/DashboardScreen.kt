package com.continuum.android.feature.dashboard.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.R
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.core.ui.LocalTokenManager
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.notes.domain.Note
import com.continuum.android.feature.tasks.domain.Task
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import java.util.Calendar

@Composable
fun DashboardScreen(
    onNotesClick: () -> Unit,
    onTasksClick: () -> Unit,
    onCareerClick: () -> Unit,
    onNoteClick: (String) -> Unit,
    networkMonitor: NetworkMonitor,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)
    val tokenManager = LocalTokenManager.current

    // Derive first name from token on first composition
    val firstName = remember {
        tokenManager.getAccessToken()?.let { "there" } ?: "there"
    }

    LaunchedEffect(Unit) { viewModel.load(firstName) }

    Column(modifier = Modifier.fillMaxSize()) {
        if (!isOnline) OfflineBanner()

        // Top app bar — wordmark centered, logo icon does nothing (already on Dashboard)
        PurpleTopAppBar(
            titleContent = {
                Icon(
                    painter = painterResource(R.drawable.ic_logo_wordmark),
                    contentDescription = "Continuum",
                    tint = White,
                    modifier = Modifier
                        .width(140.dp)
                        .height(32.dp)
                )
            }
        )

        SwipeRefresh(
            state = rememberSwipeRefreshState(state.isLoading),
            onRefresh = { viewModel.refresh(firstName) },
            modifier = Modifier.weight(1f)
        ) {
            if (state.isLoading) {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item { SkeletonLoader(Modifier.fillMaxWidth().height(60.dp)) }
                    item { SkeletonLoader(Modifier.fillMaxWidth().height(100.dp)) }
                    item { SkeletonLoader(Modifier.fillMaxWidth().height(200.dp)) }
                    item { SkeletonLoader(Modifier.fillMaxWidth().height(200.dp)) }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    // Greeting
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "Good ${greeting()}, $firstName",
                                fontFamily = FrauncesFamily,
                                fontWeight = FontWeight.Bold,
                                fontSize = 22.sp,
                                color = TextPrimary
                            )
                            Text(
                                text = todayDateString(),
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary
                            )
                        }
                    }

                    // Quick stats row
                    item {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            StatTile(
                                count = state.notesTotal,
                                label = "Notes",
                                icon = Icons.Default.MenuBook,
                                onClick = onNotesClick,
                                modifier = Modifier.weight(1f)
                            )
                            StatTile(
                                count = state.openTaskCount,
                                label = "Open Tasks",
                                icon = Icons.Default.CheckCircle,
                                onClick = onTasksClick,
                                modifier = Modifier.weight(1f)
                            )
                            StatTile(
                                count = state.openApplicationCount,
                                label = "Applications",
                                icon = Icons.Default.Work,
                                onClick = onCareerClick,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // Recent notes
                    item {
                        SectionHeader(title = "Recent Notes", onSeeAll = onNotesClick)
                    }
                    if (state.recentNotes.isEmpty()) {
                        item {
                            EmptyState(
                                icon = Icons.Default.MenuBook,
                                headline = "No notes yet",
                                subtext = "Create your first note to see it here"
                            )
                        }
                    } else {
                        item {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                items(state.recentNotes, key = { it.id }) { note ->
                                    NotePreviewCard(note = note, onClick = { onNoteClick(note.id) })
                                }
                            }
                        }
                    }

                    // Upcoming tasks
                    item {
                        SectionHeader(title = "Upcoming Tasks", onSeeAll = onTasksClick)
                    }
                    if (state.upcomingTasks.isEmpty()) {
                        item {
                            EmptyState(
                                icon = Icons.Default.CheckCircle,
                                headline = "All clear",
                                subtext = "No open tasks right now"
                            )
                        }
                    } else {
                        items(state.upcomingTasks, key = { it.id }) { task ->
                            TaskRow(task = task)
                        }
                    }

                    // Quick actions
                    item {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            ContinuumButton(
                                text = "New Note",
                                onClick = onNotesClick,
                                modifier = Modifier.weight(1f)
                            )
                            ContinuumButton(
                                text = "Add Task",
                                onClick = onTasksClick,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

@Composable
private fun StatTile(
    count: Int,
    label: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    ContinuumCard(
        modifier = modifier.clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = BrandPurple, modifier = Modifier.size(20.dp))
            Text(
                text = "$count",
                fontFamily = FrauncesFamily,
                fontWeight = FontWeight.Black,
                fontSize = 28.sp,
                color = BrandPurple
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = TextSecondary,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun SectionHeader(title: String, onSeeAll: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary
        )
        TextButton(onClick = onSeeAll, contentPadding = PaddingValues(0.dp)) {
            Text("See all", color = BrandPurple, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
private fun NotePreviewCard(note: Note, onClick: () -> Unit) {
    ContinuumCard(
        modifier = Modifier
            .width(200.dp)
            .clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (note.tags.isNotEmpty()) {
                Surface(
                    color = PurpleTint,
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = note.tags.first(),
                        style = MaterialTheme.typography.labelSmall,
                        color = BrandPurple,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
            Text(
                text = note.title,
                style = MaterialTheme.typography.headlineSmall,
                color = TextPrimary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = note.preview,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun TaskRow(task: Task) {
    val priorityColor = when (task.priority) {
        "high"   -> ErrorRed
        "medium" -> WarningAmber
        else     -> TextMuted
    }
    ContinuumCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Surface(
                color = priorityColor,
                shape = RoundedCornerShape(50),
                modifier = Modifier.size(8.dp)
            ) {}
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                task.dueDateShort?.let { date ->
                    Text(
                        text = date,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted
                    )
                }
            }
            task.priority?.let { p ->
                StatusBadge(label = p.replaceFirstChar { it.uppercase() }, type = p)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

private fun greeting(): String {
    return when (Calendar.getInstance().get(Calendar.HOUR_OF_DAY)) {
        in 0..11  -> "morning"
        in 12..16 -> "afternoon"
        else      -> "evening"
    }
}

private fun todayDateString(): String {
    val sdf = java.text.SimpleDateFormat("EEEE, MMMM d", java.util.Locale.getDefault())
    return sdf.format(java.util.Date())
}
