package com.continuum.android.feature.social.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

@Composable
fun UserProfileScreen(
    userId: String,
    onNavigateBack: () -> Unit,
    viewModel: SocialViewModel = hiltViewModel()
) {
    val state by viewModel.userProfileState.collectAsStateWithLifecycle()

    LaunchedEffect(userId) { viewModel.loadUserProfile(userId) }

    Scaffold(
        topBar = { MinimalTopBar(title = "Profile", onNavigateBack = onNavigateBack) },
        containerColor = PageBackground
    ) { padding ->
        when {
            state.isLoading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandPurple)
                }
            }
            state.user != null -> {
                val user = state.user!!
                Column(
                    modifier = Modifier.fillMaxSize().padding(padding)
                        .verticalScroll(rememberScrollState()).padding(Spacing.lg),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(Spacing.lg)
                ) {
                    AvatarInitials(name = user.fullName, size = 80.dp)
                    Text(user.fullName, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = TextPrimary)
                    user.username?.let { Text("@$it", style = MaterialTheme.typography.bodyMedium, color = TextSecondary) }
                    user.bio?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = TextSecondary) }

                    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.xxl)) {
                        StatColumn("Notes", user.notesCount)
                        StatColumn("Sets", user.setsCount)
                        StatColumn("Streak", user.streak)
                    }

                    when (user.friendStatus) {
                        "friends" -> {
                            Surface(color = SuccessGreen.copy(alpha = 0.12f), shape = AppShape.chip) {
                                Text("Friends", color = SuccessGreen, modifier = Modifier.padding(horizontal = Spacing.md, vertical = Spacing.sm), style = MaterialTheme.typography.labelMedium)
                            }
                        }
                        "pending" -> {
                            Surface(color = WarningAmber.copy(alpha = 0.12f), shape = AppShape.chip) {
                                Text("Request Pending", color = WarningAmber, modifier = Modifier.padding(horizontal = Spacing.md, vertical = Spacing.sm), style = MaterialTheme.typography.labelMedium)
                            }
                        }
                        else -> {
                            ContinuumButton(
                                text = "Add Friend",
                                onClick = { viewModel.sendFriendRequestFromProfile(userId) },
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                }
            }
            else -> {
                EmptyState(
                    icon = Icons.Default.PersonOff,
                    headline = "User not found",
                    subtext = state.error ?: "This profile is not available",
                    modifier = Modifier.fillMaxSize().padding(padding)
                )
            }
        }
    }
}

@Composable
private fun StatColumn(label: String, value: Int) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("$value", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = BrandPurple)
        Text(label, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
    }
}
