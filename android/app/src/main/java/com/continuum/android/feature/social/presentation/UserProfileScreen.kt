package com.continuum.android.feature.social.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.AsyncImage
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

@Composable
fun UserProfileScreen(
    userId: String,
    onNavigateBack: () -> Unit,
    onMessageFriend: (userId: String, displayName: String) -> Unit = { _, _ -> },
    viewModel: SocialViewModel = hiltViewModel()
) {
    val state by viewModel.userProfileState.collectAsStateWithLifecycle()
    val uriHandler = LocalUriHandler.current
    val isDemo = LocalIsDemo.current

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
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(Spacing.lg),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(Spacing.lg)
                ) {
                    Box(modifier = Modifier.size(88.dp)) {
                        if (!user.avatarUrl.isNullOrBlank()) {
                            AsyncImage(
                                model = user.avatarUrl,
                                contentDescription = user.fullName,
                                modifier = Modifier.fillMaxSize().clip(CircleShape)
                            )
                        } else {
                            AvatarInitials(name = user.fullName, modifier = Modifier.fillMaxSize())
                        }
                    }

                    VerifiedRoleBadges(roles = user.roles, expanded = true)

                    Text(user.fullName, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = TextPrimary)
                    user.username?.let { Text("@$it", style = MaterialTheme.typography.bodyMedium, color = TextSecondary) }

                    user.createdAt?.take(10)?.let { joined ->
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.CalendarMonth, null, tint = TextMuted, modifier = Modifier.size(18.dp))
                            Text("Joined $joined", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                        }
                    }

                    user.bio?.takeIf { it.isNotBlank() }?.let {
                        Text(it, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    }

                    if (!user.linkedinUrl.isNullOrBlank() || !user.instagramHandle.isNullOrBlank()) {
                        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md)) {
                            user.linkedinUrl?.takeIf { it.isNotBlank() }?.let { url ->
                                TextButton(onClick = { runCatching { uriHandler.openUri(url) } }) {
                                    Text("LinkedIn", color = BrandPurple)
                                }
                            }
                            user.instagramHandle?.takeIf { it.isNotBlank() }?.let { handle ->
                                val ig = "https://instagram.com/${handle.removePrefix("@")}"
                                TextButton(onClick = { runCatching { uriHandler.openUri(ig) } }) {
                                    Text("Instagram", color = BrandPurple)
                                }
                            }
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.xxl)) {
                        StatColumn("Notes", user.notesCount)
                        StatColumn("Sets", user.setsCount)
                        StatColumn("Streak", user.streak)
                    }

                    when (user.friendStatus) {
                        "friends" -> {
                            Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm), modifier = Modifier.fillMaxWidth()) {
                                Surface(color = SuccessGreen.copy(alpha = 0.12f), shape = AppShape.chip) {
                                    Text(
                                        "Friends",
                                        color = SuccessGreen,
                                        modifier = Modifier.padding(horizontal = Spacing.md, vertical = Spacing.sm),
                                        style = MaterialTheme.typography.labelMedium
                                    )
                                }
                                if (!isDemo) {
                                    OutlinedButton(
                                        onClick = { onMessageFriend(userId, user.fullName) },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(Icons.AutoMirrored.Filled.Chat, null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(8.dp))
                                        Text("Message")
                                    }
                                    OutlinedButton(
                                        onClick = { viewModel.removeFriendFromProfile(userId) },
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Icon(Icons.Default.PersonRemove, null, modifier = Modifier.size(18.dp))
                                        Spacer(Modifier.width(8.dp))
                                        Text("Remove friend", color = ErrorRed)
                                    }
                                }
                            }
                        }
                        "pending_incoming" -> {
                            Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm), modifier = Modifier.fillMaxWidth()) {
                                Surface(color = WarningAmber.copy(alpha = 0.12f), shape = AppShape.chip) {
                                    Text(
                                        "Wants to connect",
                                        color = WarningAmber,
                                        modifier = Modifier.padding(horizontal = Spacing.md, vertical = Spacing.sm),
                                        style = MaterialTheme.typography.labelMedium
                                    )
                                }
                                if (!isDemo) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm), modifier = Modifier.fillMaxWidth()) {
                                        ContinuumButton(
                                            text = "Accept",
                                            onClick = { viewModel.acceptIncomingFromProfile(userId) },
                                            modifier = Modifier.weight(1f)
                                        )
                                        OutlinedButton(
                                            onClick = { viewModel.declineIncomingFromProfile(userId) },
                                            modifier = Modifier.weight(1f)
                                        ) { Text("Decline") }
                                    }
                                }
                            }
                        }
                        "pending_outgoing" -> {
                            Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm), modifier = Modifier.fillMaxWidth()) {
                                Surface(color = WarningAmber.copy(alpha = 0.12f), shape = AppShape.chip) {
                                    Text(
                                        "Request sent",
                                        color = WarningAmber,
                                        modifier = Modifier.padding(horizontal = Spacing.md, vertical = Spacing.sm),
                                        style = MaterialTheme.typography.labelMedium
                                    )
                                }
                                if (!isDemo) {
                                    OutlinedButton(
                                        onClick = { viewModel.cancelOutgoingFromProfile(userId) },
                                        modifier = Modifier.fillMaxWidth()
                                    ) { Text("Cancel request") }
                                }
                            }
                        }
                        else -> {
                            if (!isDemo) {
                                ContinuumButton(
                                    text = "Add Friend",
                                    onClick = { viewModel.sendFriendRequestFromProfile(userId) },
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
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
