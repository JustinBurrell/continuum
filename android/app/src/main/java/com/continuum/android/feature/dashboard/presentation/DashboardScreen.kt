package com.continuum.android.feature.dashboard.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.R
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.LocalScrollToTopNotifier
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.core.ui.utils.toDisplayDate
import com.continuum.android.feature.career.domain.Application
import com.continuum.android.feature.flashcards.domain.FlashcardSet
import com.continuum.android.feature.notes.domain.Note
import com.continuum.android.feature.social.domain.ActivityItem
import com.continuum.android.feature.tasks.domain.Task
import java.util.Calendar

/** Appended to dashboard empty-state subtext when the demo account is active. */
private fun dashboardEmptySubtext(isDemo: Boolean, base: String): String =
    if (isDemo) "${base.trimEnd()} — Demo: read-only preview; register to add your own data." else base

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNotesClick: () -> Unit,
    onFlashcardsClick: () -> Unit,
    onTasksClick: () -> Unit,
    onApplicationsClick: () -> Unit,
    onActivityClick: () -> Unit,
    onActivityActorClick: (String) -> Unit = {},
    onMessagesClick: () -> Unit,
    onCalendarClick: () -> Unit = {},
    onNoteClick: (String) -> Unit,
    onFlashcardSetClick: (String) -> Unit,
    onApplicationClick: (String) -> Unit,
    onTaskClick: (String) -> Unit,
    networkMonitor: NetworkMonitor,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)
    val isDemo = LocalIsDemo.current
    val listState = rememberLazyListState()
    val scrollToTopNotifier = LocalScrollToTopNotifier.current
    LaunchedEffect(Unit) { viewModel.load() }
    LaunchedEffect(scrollToTopNotifier) {
        scrollToTopNotifier?.events?.collect { listState.animateScrollToItem(0) }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        if (!isOnline) OfflineBanner()

        ContinuumTopHeader(
            onCalendarClick = onCalendarClick,
            onActivityClick = onActivityClick,
            onMessagesClick = onMessagesClick,
        )

        PullToRefreshBox(
            isRefreshing = state.isLoading,
            onRefresh = { viewModel.refresh() },
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
                    state = listState,
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp)
                ) {
                    // Greeting
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = "Good ${greeting()}, ${state.firstName}",
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
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            item {
                                StatTile(
                                    count = state.notesTotal,
                                    label = "Notes",
                                    icon = Icons.AutoMirrored.Filled.MenuBook,
                                    onClick = onNotesClick
                                )
                            }
                            item {
                                StatTile(
                                    count = state.flashcardSetCount,
                                    label = "Flashcards",
                                    icon = Icons.Default.Style,
                                    onClick = onFlashcardsClick
                                )
                            }
                            item {
                                StatTile(
                                    count = state.openTaskCount,
                                    label = "Open Tasks",
                                    icon = Icons.Default.CheckCircle,
                                    onClick = onTasksClick
                                )
                            }
                            item {
                                StatTile(
                                    count = state.openApplicationCount,
                                    label = "Applications",
                                    icon = Icons.Default.Work,
                                    onClick = onApplicationsClick
                                )
                            }
                            item {
                                StatTile(
                                    count = state.newActivityCount,
                                    label = "New Activity",
                                    icon = Icons.Default.NotificationsNone,
                                    onClick = onActivityClick
                                )
                            }
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
                                subtext = dashboardEmptySubtext(isDemo, "Create your first note to see it here")
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

                    // Flashcard sets
                    item {
                        SectionHeader(title = "Flashcard Sets", onSeeAll = onFlashcardsClick)
                    }
                    if (state.flashcardSets.isEmpty()) {
                        item {
                            EmptyState(
                                icon = Icons.Default.Style,
                                headline = "No flashcard sets yet",
                                subtext = dashboardEmptySubtext(isDemo, "Create your first set to see it here")
                            )
                        }
                    } else {
                        item {
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                items(state.flashcardSets, key = { it.id }) { set ->
                                    FlashcardSetPreviewCard(
                                        set = set,
                                        onClick = { onFlashcardSetClick(set.id) }
                                    )
                                }
                            }
                        }
                    }

                    // Recent activity
                    item {
                        SectionHeader(title = "Recent Activity", onSeeAll = onActivityClick)
                    }
                    if (state.recentActivity.isEmpty()) {
                        item {
                            EmptyState(
                                icon = Icons.Default.NotificationsNone,
                                headline = "No activity yet",
                                subtext = dashboardEmptySubtext(isDemo, "Recent updates from your network appear here")
                            )
                        }
                    } else {
                        items(state.recentActivity, key = { it.id }) { item ->
                            ActivityRow(
                                item = item,
                                onClick = onActivityClick,
                                onActorClick = onActivityActorClick
                            )
                        }
                    }

                    // Applications
                    item {
                        SectionHeader(title = "Applications", onSeeAll = onApplicationsClick)
                    }
                    if (state.applications.isEmpty()) {
                        item {
                            EmptyState(
                                icon = Icons.Default.Work,
                                headline = "No applications yet",
                                subtext = dashboardEmptySubtext(isDemo, "Track your job applications to see them here")
                            )
                        }
                    } else {
                        items(state.applications, key = { it.id }) { application ->
                            ApplicationRow(
                                application = application,
                                onClick = { onApplicationClick(application.id) }
                            )
                        }
                    }

                    // Priority tasks
                    item {
                        SectionHeader(title = "Priority Tasks", onSeeAll = onTasksClick)
                    }
                    if (state.upcomingTasks.isEmpty()) {
                        item {
                            EmptyState(
                                icon = Icons.Default.CheckCircle,
                                headline = "All clear",
                                subtext = dashboardEmptySubtext(isDemo, "No open tasks right now")
                            )
                        }
                    } else {
                        items(state.upcomingTasks, key = { it.id }) { task ->
                            TaskRow(task = task, onClick = { onTaskClick(task.id) })
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
        style = CardStyle.Elevated,
        modifier = modifier
            .width(112.dp)
            .clickable(onClick = onClick)
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
        style = CardStyle.Elevated,
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
private fun FlashcardSetPreviewCard(set: FlashcardSet, onClick: () -> Unit) {
    ContinuumCard(
        style = CardStyle.Elevated,
        modifier = Modifier
            .width(220.dp)
            .clickable(onClick = onClick)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (set.isAIGenerated) {
                Surface(color = PurpleTint, shape = RoundedCornerShape(4.dp)) {
                    Text(
                        text = "AI generated",
                        style = MaterialTheme.typography.labelSmall,
                        color = BrandPurple,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }
            Text(
                text = set.title,
                style = MaterialTheme.typography.headlineSmall,
                color = TextPrimary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "${set.cardCount} cards",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun ActivityRow(item: ActivityItem, onClick: () -> Unit, onActorClick: (String) -> Unit) {
    ContinuumCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            val actorId = item.actorId
            if (actorId != null) {
                AvatarInitials(
                    name = item.actorName,
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) { onActorClick(actorId) }
                )
            } else {
                Surface(
                    color = PurpleTint,
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.size(28.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.NotificationsNone,
                            contentDescription = null,
                            tint = BrandPurple,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = buildAnnotatedString {
                            withStyle(SpanStyle(color = BrandPurple)) { append(item.actorName) }
                            append(item.displayText.removePrefix(item.actorName))
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier
                            .weight(1f, fill = false)
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) { item.actorId?.let(onActorClick) }
                    )
                    VerifiedRoleBadges(roles = item.actorRoles, expanded = false)
                }
                Text(
                    text = item.createdAt.toDisplayDate(),
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted
                )
            }
        }
    }
}

@Composable
private fun ApplicationRow(application: Application, onClick: () -> Unit) {
    ContinuumCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = application.company,
                    style = MaterialTheme.typography.headlineSmall,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = application.position,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            StatusBadge(statusString = application.status)
        }
    }
}

@Composable
private fun TaskRow(task: Task, onClick: () -> Unit) {
    val priorityColor = when (task.priority) {
        "high"   -> ErrorRed
        "medium" -> WarningAmber
        else     -> TextMuted
    }
    ContinuumCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
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
                StatusBadge(statusString = p.replaceFirstChar { it.uppercase() })
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
