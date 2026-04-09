package com.continuum.android.feature.messaging.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.messaging.domain.Conversation
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

@Composable
fun ConversationsScreen(
    onConversationClick: (String) -> Unit,
    networkMonitor: NetworkMonitor,
    onLogoClick: (() -> Unit)? = null,
    viewModel: MessagingViewModel = hiltViewModel()
) {
    val state by viewModel.conversationsState.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)

    LaunchedEffect(Unit) { viewModel.loadConversations() }

    Column(modifier = Modifier.fillMaxSize()) {
        if (!isOnline) OfflineBanner()
        PurpleTopAppBar(title = "Messages", onLogoClick = onLogoClick)

        SwipeRefresh(
            state = rememberSwipeRefreshState(state.isLoading),
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
                        headline = "No conversations yet",
                        subtext = "Message a friend from their profile",
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
                                onClick = { onConversationClick(convo.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ConversationCard(conversation: Conversation, onClick: () -> Unit) {
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
                modifier = Modifier.size(48.dp).clip(CircleShape)
            )

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        conversation.participantName,
                        style = MaterialTheme.typography.headlineSmall,
                        color = TextPrimary
                    )
                    Text(
                        conversation.lastMessageAt.take(10),
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
