package com.continuum.android.feature.notifications.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.text.ClickableText
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.AvatarInitials
import com.continuum.android.core.ui.components.ContinuumPullToRefresh
import com.continuum.android.core.ui.components.EmptyState
import com.continuum.android.core.ui.components.MinimalTopBar
import com.continuum.android.core.ui.components.SkeletonLoader
import com.continuum.android.core.ui.components.VerifiedRoleBadges
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
        "comment_added" -> when (targetType) {
            "note" -> NavRoutes.Notes.detail(targetId, commentId = notification.commentId)
            "flashcardSet" -> NavRoutes.Flashcards.setDetail(targetId, commentId = notification.commentId)
            else -> ""
        }
        "comment_reply" -> {
            // targetId is the parent comment; resourceId/resourceType hold the actual resource
            val resourceId = notification.resourceId ?: return ""
            when (notification.resourceType) {
                "note" -> NavRoutes.Notes.detail(resourceId, commentId = notification.commentId)
                "flashcardSet" -> NavRoutes.Flashcards.setDetail(resourceId, commentId = notification.commentId)
                else -> ""
            }
        }
        "like_added" -> {
            // targetId is the liked comment; resourceId/resourceType hold the parent resource
            val resourceId = notification.resourceId ?: return ""
            when (notification.resourceType) {
                "note" -> NavRoutes.Notes.detail(resourceId, commentId = notification.commentId)
                "flashcardSet" -> NavRoutes.Flashcards.setDetail(resourceId, commentId = notification.commentId)
                else -> ""
            }
        }
        "mention" -> {
            // targetId is the comment; resourceId/resourceType hold the parent resource
            val resourceId = notification.resourceId ?: return ""
            when (notification.resourceType) {
                "note" -> NavRoutes.Notes.detail(resourceId, commentId = notification.commentId)
                "flashcardSet" -> NavRoutes.Flashcards.setDetail(resourceId, commentId = notification.commentId)
                "task" -> NavRoutes.Tasks.detail(resourceId)
                else -> ""
            }
        }
        "friend_request", "friend_accepted" -> NavRoutes.Social.userProfile(actorId)
        else -> ""
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
    onActorClick: (String) -> Unit = {},
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
                                    onActorClick = { onActorClick(notification.actorId) },
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
// NotificationItemRow — Instagram-style: avatar, name+roles, message, preview, timestamp
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotificationItemRow(
    notification: Notification,
    onDelete: () -> Unit,
    onActorClick: () -> Unit,
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
            verticalAlignment = Alignment.Top
        ) {
            // Avatar with unread dot overlaid at bottom-end corner
            Box {
                AvatarInitials(
                    name = notification.actorName,
                    imageUrl = notification.actorAvatarUrl,
                    size = 44.dp,
                    modifier = Modifier
                        .clip(CircleShape)
                        .clickable(onClick = onActorClick)
                )
                if (!notification.read) {
                    Box(
                        modifier = Modifier
                            .size(11.dp)
                            .align(Alignment.BottomEnd)
                            .background(BrandPurple, CircleShape)
                            .border(2.dp, MaterialTheme.colorScheme.surface, CircleShape)
                    )
                }
            }

            // Content column
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                // Actor name (tappable) + action text as a single flowing text block
                val firstName = notification.actorName.substringBefore(' ')
                val actionText = notification.message.run {
                    when {
                        startsWith(notification.actorName) -> removePrefix(notification.actorName).trimStart()
                        startsWith(firstName) -> removePrefix(firstName).trimStart()
                        else -> this
                    }
                }
                val annotatedMessage = buildAnnotatedString {
                    pushStringAnnotation("actor", "click")
                    withStyle(SpanStyle(fontWeight = FontWeight.SemiBold, color = BrandPurple)) {
                        append(notification.actorName)
                    }
                    pop()
                    append(' ')
                    append(actionText)
                }
                ClickableText(
                    text = annotatedMessage,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = if (!notification.read) TextPrimary else TextSecondary
                    ),
                    onClick = { offset ->
                        annotatedMessage.getStringAnnotations("actor", offset, offset)
                            .firstOrNull()?.let { onActorClick() }
                    }
                )
                if (notification.actorRoles.isNotEmpty()) {
                    VerifiedRoleBadges(roles = notification.actorRoles, expanded = false)
                }

                // Preview text: comment content or actual message body
                val previewText = notification.commentPreview ?: notification.messagePreview
                if (!previewText.isNullOrBlank()) {
                    Text(
                        text = "\"$previewText\"",
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                        ),
                        color = TextMuted,
                        maxLines = 2,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                }

                // Timestamp
                Text(
                    text = notification.createdAt.toNotificationTime(),
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted
                )
            }
        }
    }
}
