package com.continuum.android.feature.social.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import com.continuum.android.feature.social.domain.ActivityItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityFeedScreen(
    onSharedNoteClick: (String) -> Unit,
    onUserClick: (String) -> Unit = {},
    networkMonitor: NetworkMonitor,
    onLogoClick: (() -> Unit)? = null,
    onNavigateBack: (() -> Unit)? = null,
    viewModel: SocialViewModel = hiltViewModel()
) {
    val state by viewModel.activityState.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)
    val isDemo = LocalIsDemo.current
    val listState = rememberLazyListState()

    LaunchedEffect(Unit) {
        viewModel.loadActivity()
        if (!isDemo) viewModel.markActivitySeen()
    }

    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            lastVisible >= state.items.size - 3 && state.nextCursor != null
        }
    }
    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) viewModel.loadMoreActivity()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        if (!isOnline) OfflineBanner()
        InlineScreenHeader(title = "Activity")

        OutlinedTextField(
            value = state.searchQuery,
            onValueChange = viewModel::setActivitySearch,
            placeholder = { Text("Search activity…") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = BrandPurple,
                cursorColor = BrandPurple
            )
        )

        PullToRefreshBox(
            isRefreshing = state.isLoading,
            onRefresh = { viewModel.loadActivity() },
            modifier = Modifier.weight(1f)
        ) {
            when {
                state.isLoading && state.items.isEmpty() -> {
                    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(5) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(70.dp)) }
                    }
                }

                state.items.isEmpty() -> {
                    EmptyState(
                        icon = Icons.Default.FiberNew,
                        headline = if (state.searchQuery.isNotBlank()) "No results" else "No activity yet",
                        subtext = if (state.searchQuery.isNotBlank()) "Try a different search term" else "Connect with friends to see their activity here",
                        modifier = Modifier.fillMaxSize()
                    )
                }

                else -> {
                    LazyColumn(
                        state = listState,
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(state.items, key = { it.id }) { item ->
                            ActivityCard(
                                item = item,
                                onClick = {
                                    if (item.type == "note_shared" && item.resourceId != null) {
                                        onSharedNoteClick(item.resourceId)
                                    }
                                },
                                onUserClick = { item.actorId?.let(onUserClick) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActivityCard(item: ActivityItem, onClick: () -> Unit, onUserClick: () -> Unit) {
    val isClickable = item.type == "note_shared" && item.resourceId != null

    ContinuumCard(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (isClickable) Modifier.clickable(onClick = onClick) else Modifier)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AvatarInitials(
                name = item.actorName,
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .clickable(onClick = onUserClick)
            )
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        item.displayText,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextPrimary,
                        modifier = Modifier.weight(1f, fill = false).clickable(onClick = onUserClick)
                    )
                    VerifiedRoleBadges(roles = item.actorRoles, expanded = false)
                }
                Text(item.createdAt.toDisplayDate(), style = MaterialTheme.typography.bodySmall, color = TextMuted)
            }
            Icon(
                imageVector = when (item.type) {
                    "note_shared" -> Icons.Default.Article
                    "flashcard_shared" -> Icons.Default.Style
                    "task_created" -> Icons.Default.CheckBox
                    "friend_accepted" -> Icons.Default.People
                    else -> Icons.Default.Notifications
                },
                contentDescription = null,
                tint = BrandPurple,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
