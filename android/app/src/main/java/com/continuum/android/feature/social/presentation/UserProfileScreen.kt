package com.continuum.android.feature.social.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import com.continuum.android.R
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.AsyncImage
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.core.ui.utils.toDisplayDate
import com.continuum.android.feature.social.domain.ActivityItem
import com.continuum.android.feature.social.domain.FriendSharedNoteSummary
import com.continuum.android.feature.social.domain.FriendSharedSetSummary
import com.continuum.android.feature.social.domain.FriendSharedTaskSummary

@Composable
fun UserProfileScreen(
    userId: String,
    currentUserId: String?,
    onNavigateBack: () -> Unit,
    onViewingSelf: () -> Unit,
    onMessageFriend: (userId: String, displayName: String) -> Unit = { _, _ -> },
    onOpenSharedNote: (String) -> Unit = {},
    onOpenTask: (String) -> Unit = {},
    onOpenSet: (String) -> Unit = {},
    viewModel: SocialViewModel = hiltViewModel()
) {
    val state by viewModel.userProfileState.collectAsStateWithLifecycle()
    val uriHandler = LocalUriHandler.current
    val isDemo = LocalIsDemo.current

    val isSelf = currentUserId != null && userId == currentUserId

    LaunchedEffect(userId) {
        viewModel.loadUserProfile(userId)
    }

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

                    user.createdAt?.toDisplayDate()?.let { joined ->
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.CalendarMonth, null, tint = TextMuted, modifier = Modifier.size(18.dp))
                            Text("Joined $joined", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                        }
                    }

                    user.bio?.takeIf { it.isNotBlank() }?.let {
                        Text(it, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    }

                    if (!user.linkedinUrl.isNullOrBlank() || !user.instagramHandle.isNullOrBlank()) {
                        Row(horizontalArrangement = Arrangement.spacedBy(Spacing.md), verticalAlignment = Alignment.CenterVertically) {
                            user.linkedinUrl?.takeIf { it.isNotBlank() }?.let { url ->
                                Surface(
                                    onClick = { runCatching { uriHandler.openUri(url) } },
                                    color = Color(0xFF0A66C2),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Icon(
                                        painter = painterResource(R.drawable.ic_linkedin),
                                        contentDescription = "LinkedIn",
                                        tint = Color.White,
                                        modifier = Modifier.padding(6.dp).size(18.dp)
                                    )
                                }
                            }
                            user.instagramHandle?.takeIf { it.isNotBlank() }?.let { handle ->
                                val ig = "https://instagram.com/${handle.removePrefix("@")}"
                                Surface(
                                    onClick = { runCatching { uriHandler.openUri(ig) } },
                                    color = Color(0xFFE1306C),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Icon(
                                        painter = painterResource(R.drawable.ic_instagram),
                                        contentDescription = "Instagram",
                                        tint = Color.White,
                                        modifier = Modifier.padding(6.dp).size(18.dp)
                                    )
                                }
                            }
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.xxl)) {
                        StatColumn("Notes", user.notesCount)
                        StatColumn("Sets", user.setsCount)
                        StatColumn("Streak", user.streak)
                    }

                    if (isSelf) {
                        OutlinedButton(onClick = onViewingSelf, modifier = Modifier.fillMaxWidth()) {
                            Icon(Icons.Default.Settings, null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Edit Profile & Settings")
                        }
                    }

                    if (!isSelf) when (user.friendStatus) {
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
                    } // end if (!isSelf) when

                    if (!isSelf && user.friendStatus == "friends") {
                        if (state.friendExtrasLoading) {
                            Row(
                                Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(28.dp),
                                    strokeWidth = 2.dp,
                                    color = BrandPurple
                                )
                            }
                        }
                        FriendProfileSections(
                            notes = state.friendExtras.sharedNotes,
                            tasks = state.friendExtras.sharedTasks,
                            sets = state.friendExtras.sharedSets,
                            activity = state.friendExtras.recentActivity,
                            onOpenSharedNote = onOpenSharedNote,
                            onOpenTask = onOpenTask,
                            onOpenSet = onOpenSet
                        )
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
private fun FriendProfileSections(
    notes: List<FriendSharedNoteSummary>,
    tasks: List<FriendSharedTaskSummary>,
    sets: List<FriendSharedSetSummary>,
    activity: List<ActivityItem>,
    onOpenSharedNote: (String) -> Unit,
    onOpenTask: (String) -> Unit,
    onOpenSet: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(Spacing.lg)) {
        if (notes.isNotEmpty()) {
            ProfileSectionTitle("Shared notes")
            notes.forEach { n ->
                ContinuumCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenSharedNote(n.id) }
                ) {
                    Column(Modifier.padding(Spacing.md)) {
                        Text(n.title, style = MaterialTheme.typography.titleSmall, color = TextPrimary, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Text(n.type, style = MaterialTheme.typography.labelSmall, color = TextMuted)
                    }
                }
            }
        }
        if (tasks.isNotEmpty()) {
            ProfileSectionTitle("Shared tasks")
            tasks.forEach { t ->
                ContinuumCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenTask(t.id) }
                ) {
                    Column(Modifier.padding(Spacing.md)) {
                        Text(t.title, style = MaterialTheme.typography.titleSmall, color = TextPrimary, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Text(t.status.replace("_", " "), style = MaterialTheme.typography.labelSmall, color = TextMuted)
                    }
                }
            }
        }
        if (sets.isNotEmpty()) {
            ProfileSectionTitle("Shared flashcard sets")
            sets.forEach { s ->
                ContinuumCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenSet(s.id) }
                ) {
                    Column(Modifier.padding(Spacing.md)) {
                        Text(s.title, style = MaterialTheme.typography.titleSmall, color = TextPrimary, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        Text("${s.cardCount} cards", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                    }
                }
            }
        }
        if (activity.isNotEmpty()) {
            ProfileSectionTitle("Recent activity")
            activity.forEach { item ->
                ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(Spacing.md)) {
                        Text(item.displayText, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                        Text(item.createdAt.toDisplayDate(), style = MaterialTheme.typography.labelSmall, color = TextMuted)
                    }
                }
            }
        }
        if (notes.isEmpty() && tasks.isEmpty() && sets.isEmpty() && activity.isEmpty()) {
            Text(
                "No shared content or activity yet.",
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
private fun ProfileSectionTitle(text: String) {
    Text(
        text,
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold,
        color = TextPrimary,
        modifier = Modifier.fillMaxWidth()
    )
}

@Composable
private fun StatColumn(label: String, value: Int) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("$value", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = BrandPurple)
        Text(label, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
    }
}
