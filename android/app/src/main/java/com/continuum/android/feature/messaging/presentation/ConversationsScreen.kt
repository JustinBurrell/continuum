package com.continuum.android.feature.messaging.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.core.ui.utils.toDisplayDate
import com.continuum.android.feature.messaging.domain.Conversation
import androidx.compose.material3.ExperimentalMaterial3Api
import com.continuum.android.core.ui.components.ContinuumPullToRefresh

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConversationsScreen(
    onConversationClick: (conversationId: String, participantName: String, participantId: String) -> Unit,
    networkMonitor: NetworkMonitor,
    onLogoClick: (() -> Unit)? = null,
    onParticipantProfileClick: ((String) -> Unit)? = null,
    viewModel: MessagingViewModel = hiltViewModel()
) {
    val state by viewModel.conversationsState.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)
    val isDemo = LocalIsDemo.current

    LaunchedEffect(Unit) { viewModel.loadConversations() }

    Column(modifier = Modifier.fillMaxSize()) {
        if (!isOnline) OfflineBanner()
        InlineScreenHeader(title = "Messages")

        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = viewModel::setConversationSearch,
            placeholder = { Text("Search conversations…") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = BrandPurple,
                cursorColor = BrandPurple
            )
        )

        ContinuumPullToRefresh(
            isLoading = state.isLoading,
            onRefresh = { viewModel.loadConversations() },
            modifier = Modifier.weight(1f)
        ) {
            when {
                state.isLoading && state.conversations.isEmpty() -> {
                    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(5) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(72.dp)) }
                    }
                }

                state.conversations.isEmpty() -> {
                    EmptyState(
                        icon = Icons.Default.ChatBubbleOutline,
                        headline = if (state.searchQuery.isNotBlank()) "No results for \"${state.searchQuery}\"" else "No conversations yet",
                        subtext = if (state.searchQuery.isNotBlank()) "Try a different search" else "Message a friend from their profile",
                        clearSearchAction = if (state.searchQuery.isNotBlank()) { { viewModel.setConversationSearch("") } } else null,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(state.conversations, key = { it.id }) { convo ->
                            ConversationCard(
                                conversation = convo,
                                onClick = {
                                    onConversationClick(convo.id, convo.participantName, convo.participantId)
                                },
                                onDelete = if (isDemo) null else { { viewModel.deleteConversation(convo.id) } },
                                onParticipantClick = onParticipantProfileClick?.let { nav -> { nav(convo.participantId) } }
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ConversationCard(
    conversation: Conversation,
    onClick: () -> Unit,
    onDelete: (() -> Unit)?,
    onParticipantClick: (() -> Unit)? = null
) {
    val card: @Composable () -> Unit = {
        ContinuumCard(
            modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AvatarInitials(
                    name = conversation.participantName,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .then(if (onParticipantClick != null) Modifier.clickable(onClick = onParticipantClick) else Modifier)
                )

                Column(modifier = Modifier.weight(1f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Row(
                            modifier = Modifier.weight(1f),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                conversation.participantName,
                                style = MaterialTheme.typography.headlineSmall,
                                color = TextPrimary
                            )
                            VerifiedRoleBadges(roles = conversation.participantRoles, expanded = false)
                        }
                        Text(
                            conversation.lastMessageAt.toDisplayDate(),
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMuted
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            conversation.lastMessage,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary,
                            maxLines = 1,
                            modifier = Modifier.weight(1f)
                        )
                        if (conversation.unreadCount > 0) {
                            Badge(containerColor = BrandPurple, modifier = Modifier.padding(start = 8.dp)) {
                                Text(
                                    "${conversation.unreadCount}",
                                    color = White,
                                    style = MaterialTheme.typography.labelSmall
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (onDelete == null) {
        card()
    } else {
        val swipeState = rememberSwipeToDismissBoxState(
            confirmValueChange = { value ->
                if (value == SwipeToDismissBoxValue.EndToStart) {
                    onDelete()
                    false
                } else false
            }
        )
        SwipeToDismissBox(
            state = swipeState,
            backgroundContent = {
                Box(Modifier.fillMaxSize().padding(end = 16.dp), contentAlignment = Alignment.CenterEnd) {
                    Icon(Icons.Default.Delete, null, tint = ErrorRed)
                }
            },
            enableDismissFromStartToEnd = false
        ) {
            card()
        }
    }
}
