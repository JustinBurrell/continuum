package com.continuum.android.feature.social.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.social.domain.UserSearchResult

@Composable
fun UserSearchScreen(
    onNavigateBack: () -> Unit,
    onUserClick: (String) -> Unit = {},
    viewModel: SocialViewModel = hiltViewModel()
) {
    val state by viewModel.searchState.collectAsStateWithLifecycle()
    var query by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = "Find people",
                onNavigateBack = onNavigateBack
            )
        }
    ) { innerPadding ->
        Column(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it; viewModel.searchUsers(it) },
                placeholder = { Text("Search by name or username...") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(8.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, unfocusedBorderColor = Border),
                leadingIcon = { Icon(Icons.Default.Search, null, tint = TextSecondary) },
                trailingIcon = {
                    if (query.isNotBlank()) {
                        IconButton(onClick = { query = ""; viewModel.searchUsers("") }) {
                            Icon(Icons.Default.Close, null, tint = TextSecondary)
                        }
                    }
                }
            )

            when {
                state.isLoading -> {
                    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(4) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(64.dp)) }
                    }
                }

                query.isBlank() -> {
                    EmptyState(
                        icon = Icons.Default.Search,
                        headline = "Search for people",
                        subtext = "Find friends by name or username",
                        modifier = Modifier.fillMaxSize()
                    )
                }

                state.results.isEmpty() -> {
                    EmptyState(
                        icon = Icons.Default.PersonOff,
                        headline = "No results",
                        subtext = "No users found for \"$query\"",
                        modifier = Modifier.fillMaxSize()
                    )
                }

                else -> {
                    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(state.results, key = { it.id }) { user ->
                            UserSearchCard(
                                user = user,
                                onAddFriend = { viewModel.sendFriendRequest(user.id) },
                                onClick = { onUserClick(user.id) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun UserSearchCard(user: UserSearchResult, onAddFriend: () -> Unit, onClick: () -> Unit) {
    ContinuumCard(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                AvatarInitials(name = user.fullName, modifier = Modifier.size(40.dp).clip(CircleShape))
                Column {
                    Text(user.fullName, style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                    user.username?.let { Text("@$it", style = MaterialTheme.typography.bodySmall, color = TextSecondary) }
                }
            }

            when (user.friendStatus) {
                "friends" -> OutlinedButton(
                    onClick = {},
                    enabled = false,
                    shape = MaterialTheme.shapes.small,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = SuccessGreen)
                ) { Text("Friends") }

                "pending" -> OutlinedButton(
                    onClick = {},
                    enabled = false,
                    shape = MaterialTheme.shapes.small,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary)
                ) { Text("Pending") }

                else -> ContinuumButton(text = "Add", onClick = onAddFriend, modifier = Modifier.height(36.dp))
            }
        }
    }
}
