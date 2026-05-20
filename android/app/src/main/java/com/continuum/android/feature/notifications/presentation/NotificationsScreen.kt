package com.continuum.android.feature.notifications.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.AvatarInitials
import com.continuum.android.core.ui.components.ContinuumPullToRefresh
import com.continuum.android.core.ui.components.EmptyState
import com.continuum.android.core.ui.components.MinimalTopBar
import com.continuum.android.core.ui.components.SkeletonLoader
import com.continuum.android.core.ui.navigation.NavRoutes
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.ErrorRed
import com.continuum.android.core.ui.theme.TextMuted
import com.continuum.android.core.ui.theme.TextPrimary
import com.continuum.android.core.ui.theme.TextSecondary
import com.continuum.android.core.ui.utils.notificationTimeGroup
import com.continuum.android.core.ui.utils.toNotificationTime
import com.continuum.android.feature.notifications.domain.Notification

// ---------------------------------------------------------------------------
// resolveNav: maps a notification to an Android nav route string
// ---------------------------------------------------------------------------

fun resolveNav(notification: Notification): String {
    val targetId = notification.targetId
    val targetType = notification.targetType
    val actorId = notification.actorId
    return when (notification.type) {
        "new_message" -> NavRoutes.Social.conversationDetail(targetId)
        "share_received" -> when (targetType) {
            "note" -> NavRoutes.Social.sharedNote(targetId)
            "flashcardSet" -> NavRoutes.Flashcards.setDetail(targetId)
            else -> ""
        }
        "task_assigned" -> NavRoutes.Tasks.detail(targetId)
        "comment_added", "comment_reply", "like_added" -> when (targetType) {
            "note" -> NavRoutes.Notes.detail(targetId)
            "flashcardSet" -> NavRoutes.Flashcards.setDetail(targetId)
            else -> ""
        }
        "friend_request", "friend_accepted" -> NavRoutes.Social.userProfile(actorId)
        else -> ""
    }
}

// ---------------------------------------------------------------------------
// NotificationBell: badge icon for use in the dashboard header
// ---------------------------------------------------------------------------

@Composable
fun NotificationBell(
    unreadCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    BadgedBox(
        badge = {
            if (unreadCount > 0) {
                Badge(containerColor = ErrorRed) {
                    Text(
                        text = if (unreadCount > 9) "9+" else "$unreadCount",
                        color = Color.White,
                        fontSize = 9.sp
                    )
                }
            }
        },
        modifier = modifier
    ) {
        IconButton(onClick = onClick) {
            Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = TextPrimary)
        }
    }
}

// ---------------------------------------------------------------------------
// NotificationsScreen
// ---------------------------------------------------------------------------

private val GROUP_ORDER = listOf("Today", "This week", "This month", "Earlier")

private fun groupNotifications(items: List<Notification>): Map<String, List<Notification>> {
    val grouped = items.groupBy { notificationTimeGroup(it.createdAt) }
    return GROUP_ORDER
        .filter { grouped.containsKey(it) }
        .associateWith { grouped[it] ?: emptyList() }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    onNavigateBack: () -> Unit,
    onNavigateTo: (String) -> Unit,
    viewModel: NotificationsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()

    LaunchedEffect(Unit) { viewModel.loadNotifications() }

    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            lastVisible >= state.items.size - 3 && state.nextCursor != null
        }
    }
    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) viewModel.loadMore()
    }

    val grouped = remember(state.items) { groupNotifications(state.items) }

    Column(modifier = Modifier.fillMaxSize()) {
        MinimalTopBar(
            title = "Notifications",
            onNavigateBack = onNavigateBack,
            actions = {
                if (state.unreadCount > 0) {
                    TextButton(
                        onClick = { viewModel.markAllRead() },
                        enabled = !state.isMarkingAllRead
                    ) {
                        Text("Mark all read", color = BrandPurple, fontSize = 13.sp)
                    }
                }
            }
        )

        ContinuumPullToRefresh(
            isLoading = state.isLoading,
            onRefresh = { viewModel.loadNotifications() },
            modifier = Modifier.weight(1f)
        ) {
            when {
                state.isLoading && state.items.isEmpty() -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(5) {
                            SkeletonLoader(modifier = Modifier.fillMaxWidth().height(70.dp))
                        }
                    }
                }

                state.items.isEmpty() -> {
                    EmptyState(
                        icon = Icons.Default.Notifications,
                        headline = "No notifications yet",
                        subtext = "When friends interact with your content you'll see it here",
                        modifier = Modifier.fillMaxSize()
                    )
                }

                else -> {
                    LazyColumn(
                        state = listState,
                        contentPadding = PaddingValues(bottom = 24.dp)
                    ) {
                        grouped.forEach { (group, groupItems) ->
                            item(key = "header_$group") {
                                Text(
                                    text = group,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextMuted,
                                    fontWeight = FontWeight.SemiBold,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 8.dp)
                                )
                            }
                            items(groupItems, key = { it.id }) { notification ->
                                NotificationItemRow(
                                    notification = notification,
                                    onDelete = { viewModel.deleteNotification(notification.id) },
                                    onClick = {
                                        viewModel.markOneRead(notification.id)
                                        val route = resolveNav(notification)
                                        if (route.isNotBlank()) onNavigateTo(route)
                                    }
                                )
                                HorizontalDivider(
                                    modifier = Modifier.padding(start = 72.dp),
                                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// NotificationItemRow
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotificationItemRow(
    notification: Notification,
    onDelete: () -> Unit,
    onClick: () -> Unit
) {
    val dismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            if (value == SwipeToDismissBoxValue.EndToStart) {
                onDelete()
                false
            } else false
        }
    )

    SwipeToDismissBox(
        state = dismissState,
        enableDismissFromStartToEnd = false,
        backgroundContent = {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(ErrorRed)
                    .padding(end = 20.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color.White)
            }
        }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface)
                .clickable(onClick = onClick)
                .padding(vertical = 12.dp, horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .height(40.dp)
                    .background(
                        color = if (!notification.read) BrandPurple else Color.Transparent,
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(2.dp)
                    )
            )

            AvatarInitials(
                name = notification.actorName,
                imageUrl = notification.actorAvatarUrl,
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
            )

            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                Text(
                    text = notification.message,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextPrimary,
                    fontWeight = if (!notification.read) FontWeight.SemiBold else FontWeight.Normal
                )
                Text(
                    text = notification.createdAt.toNotificationTime(),
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted
                )
            }
        }
    }
}
