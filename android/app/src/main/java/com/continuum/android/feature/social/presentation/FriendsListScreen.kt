package com.continuum.android.feature.social.presentation

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
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.social.domain.Friend
import com.continuum.android.feature.social.domain.FriendRequest
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FriendsListScreen(
    onUserSearch: () -> Unit,
    onUserClick: (String) -> Unit = {},
    onNavigateBack: (() -> Unit)? = null,
    viewModel: SocialViewModel = hiltViewModel()
) {
    val state by viewModel.friendsState.collectAsStateWithLifecycle()
    val isDemo = LocalIsDemo.current
    var selectedTab by remember { mutableIntStateOf(0) }
    var friendToRemove by remember { mutableStateOf<Friend?>(null) }

    LaunchedEffect(Unit) { viewModel.loadFriends() }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            MinimalTopBar(title = "Friends", onNavigateBack = onNavigateBack)

            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = White,
                contentColor = BrandPurple,
                divider = { HorizontalDivider(color = Border) }
            ) {
                Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                    Text("Friends", modifier = Modifier.padding(vertical = 12.dp))
                }
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 }
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Requests", modifier = Modifier.padding(vertical = 12.dp))
                        if (state.incomingRequests.isNotEmpty()) {
                            Spacer(Modifier.width(4.dp))
                            Badge(containerColor = BrandPurple) {
                                Text("${state.incomingRequests.size}", color = White)
                            }
                        }
                    }
                }
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 }
                ) {
                    Text("Sent", modifier = Modifier.padding(vertical = 12.dp))
                }
            }

            PullToRefreshBox(
                isRefreshing = state.isLoading,
                onRefresh = { viewModel.loadFriends() },
                modifier = Modifier.weight(1f)
            ) {
                when (selectedTab) {
                    0 -> {
                        if (state.friends.isEmpty()) {
                            EmptyState(
                                icon = Icons.Default.PersonAdd,
                                headline = "No friends yet",
                                subtext = "Search for people to connect with",
                                actionLabel = "Find friends",
                                onAction = onUserSearch,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(state.friends, key = { it.id }) { friend ->
                                    FriendCard(
                                        friend = friend,
                                        onRemove = if (isDemo) null else { { friendToRemove = friend } },
                                        onClick = { onUserClick(friend.userId) }
                                    )
                                }
                            }
                        }
                    }

                    1 -> {
                        if (state.incomingRequests.isEmpty()) {
                            EmptyState(
                                icon = Icons.Default.Inbox,
                                headline = "No pending requests",
                                subtext = "Friend requests will appear here",
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(state.incomingRequests, key = { it.id }) { request ->
                                    FriendRequestCard(
                                        request = request,
                                        onAccept = if (isDemo) null else { { viewModel.acceptRequest(request.id) } },
                                        onDecline = if (isDemo) null else { { viewModel.declineRequest(request.id) } },
                                        onUserClick = { onUserClick(request.sender.userId) }
                                    )
                                }
                            }
                        }
                    }

                    2 -> {
                        if (state.sentRequests.isEmpty()) {
                            EmptyState(
                                icon = Icons.Default.Send,
                                headline = "No sent requests",
                                subtext = "Requests you've sent will appear here",
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            LazyColumn(
                                contentPadding = PaddingValues(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(state.sentRequests, key = { it.id }) { request ->
                                    SentRequestCard(
                                        request = request,
                                        onCancel = if (isDemo) null else { { viewModel.cancelSentRequest(request.id) } },
                                        onUserClick = { onUserClick(request.receiver.userId) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        if (!isDemo) {
            FloatingActionButton(
                onClick = onUserSearch,
                containerColor = BrandPurple,
                contentColor = White,
                modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp)
            ) {
                Icon(Icons.Default.PersonAdd, "Find friends")
            }
        }
    }

    friendToRemove?.let { friend ->
        AlertDialog(
            onDismissRequest = { friendToRemove = null },
            title = { Text("Remove friend?") },
            text = { Text("Remove ${friend.fullName} from your friends?") },
            confirmButton = {
                TextButton(onClick = { viewModel.removeFriend(friend.id); friendToRemove = null }) {
                    Text("Remove", color = ErrorRed)
                }
            },
            dismissButton = { TextButton(onClick = { friendToRemove = null }) { Text("Cancel") } }
        )
    }
}

@Composable
private fun FriendCard(friend: Friend, onRemove: (() -> Unit)?, onClick: () -> Unit) {
    val card: @Composable () -> Unit = {
        ContinuumCard(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AvatarInitials(name = friend.fullName, modifier = Modifier.size(40.dp).clip(CircleShape))
                Column(modifier = Modifier.weight(1f)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(friend.fullName, style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                        VerifiedRoleBadges(roles = friend.roles, expanded = false)
                    }
                    friend.username?.let {
                        Text("@$it", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                    if (friend.mutualFriendsCount > 0) {
                        Text("${friend.mutualFriendsCount} mutual friends",
                            style = MaterialTheme.typography.bodySmall, color = TextMuted)
                    }
                }
            }
        }
    }

    if (onRemove == null) {
        card()
    } else {
        val swipeToDismissState = rememberSwipeToDismissBoxState(
            confirmValueChange = { value ->
                if (value == SwipeToDismissBoxValue.EndToStart) {
                    onRemove()
                    false
                } else false
            }
        )
        SwipeToDismissBox(
            state = swipeToDismissState,
            backgroundContent = {
                Box(Modifier.fillMaxSize().padding(end = 16.dp), contentAlignment = Alignment.CenterEnd) {
                    Icon(Icons.Default.PersonRemove, null, tint = ErrorRed)
                }
            },
            enableDismissFromStartToEnd = false
        ) {
            card()
        }
    }
}

@Composable
private fun SentRequestCard(request: FriendRequest, onCancel: (() -> Unit)?, onUserClick: (() -> Unit)? = null) {
    ContinuumCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f).then(if (onUserClick != null) Modifier.clickable(onClick = onUserClick) else Modifier)
            ) {
                AvatarInitials(name = request.receiver.fullName, modifier = Modifier.size(40.dp).clip(CircleShape))
                Column {
                    Text(request.receiver.fullName, style = MaterialTheme.typography.headlineSmall, color = if (onUserClick != null) BrandPurple else TextPrimary)
                    request.receiver.username?.let {
                        Text("@$it", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                }
            }
            onCancel?.let { cancel ->
                TextButton(onClick = cancel) { Text("Cancel", color = ErrorRed) }
            }
        }
    }
}

@Composable
private fun FriendRequestCard(
    request: FriendRequest,
    onAccept: (() -> Unit)?,
    onDecline: (() -> Unit)?,
    onUserClick: (() -> Unit)? = null
) {
    ContinuumCard(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f).then(if (onUserClick != null) Modifier.clickable(onClick = onUserClick) else Modifier)
            ) {
                AvatarInitials(name = request.sender.fullName, modifier = Modifier.size(40.dp).clip(CircleShape))
                Column {
                    Text(request.sender.fullName, style = MaterialTheme.typography.headlineSmall, color = if (onUserClick != null) BrandPurple else TextPrimary)
                    request.sender.username?.let {
                        Text("@$it", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                }
            }
            if (onAccept != null && onDecline != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDecline) { Text("Decline", color = ErrorRed) }
                    ContinuumButton(text = "Accept", onClick = onAccept, modifier = Modifier.height(36.dp))
                }
            }
        }
    }
}
