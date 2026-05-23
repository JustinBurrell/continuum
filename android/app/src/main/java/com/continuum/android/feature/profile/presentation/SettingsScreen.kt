package com.continuum.android.feature.profile.presentation

import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationManagerCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.delay
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.components.MinimalTopBar
import com.continuum.android.core.ui.theme.*

@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    onReplayTour: () -> Unit = {},
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val profile = state.profile

    val context = LocalContext.current
    var emailNotifications by remember { mutableStateOf(true) }
    var pushMessages       by remember { mutableStateOf(true) }
    var pushComments       by remember { mutableStateOf(true) }
    var pushLikes          by remember { mutableStateOf(true) }
    var pushFriendRequests by remember { mutableStateOf(true) }
    var pushTasks          by remember { mutableStateOf(true) }
    var pushSharedContent  by remember { mutableStateOf(true) }
    var activityVisibility by remember { mutableStateOf("friends") }

    val osNotificationsEnabled by remember {
        derivedStateOf { NotificationManagerCompat.from(context).areNotificationsEnabled() }
    }

    LaunchedEffect(Unit) { viewModel.load() }

    LaunchedEffect(profile) {
        val p = profile ?: return@LaunchedEffect
        val pn = p.pushNotifications
        emailNotifications = p.emailNotifications
        pushMessages       = pn.messages
        pushComments       = pn.comments
        pushLikes          = pn.likes
        pushFriendRequests = pn.friendRequests
        pushTasks          = pn.tasks
        pushSharedContent  = pn.sharedContent
        activityVisibility = p.activityVisibility.ifBlank { "friends" }
    }

    LaunchedEffect(state.successMessage) {
        if (state.successMessage != null) {
            delay(1800)
            viewModel.clearMessage()
        }
    }

    fun saveSettings() {
        viewModel.updateProfileFields(
            mapOf(
                "settings.emailNotifications"                  to emailNotifications.toString(),
                "settings.pushNotifications.messages"          to pushMessages.toString(),
                "settings.pushNotifications.comments"          to pushComments.toString(),
                "settings.pushNotifications.likes"             to pushLikes.toString(),
                "settings.pushNotifications.friendRequests"    to pushFriendRequests.toString(),
                "settings.pushNotifications.tasks"             to pushTasks.toString(),
                "settings.pushNotifications.sharedContent"     to pushSharedContent.toString(),
                "settings.activityVisibility"                  to activityVisibility,
            )
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {
        MinimalTopBar(title = "Settings", onNavigateBack = onNavigateBack)

        if (state.isLoading && profile == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandPurple)
            }
            return@Column
        }

        val isDemo = profile?.isDemo == true

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                Text(
                    if (isDemo) {
                        "Demo account: settings are view-only."
                    } else {
                        "Changes are not saved until you tap Save changes."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    modifier = Modifier.padding(bottom = 8.dp)
                )
            }

            item { SettingsSectionLabel("Activity visibility") }
            item {
                val options = listOf("private", "friends", "public")
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    options.forEach { option ->
                        FilterChip(
                            selected = activityVisibility == option,
                            onClick = { if (!isDemo) activityVisibility = option },
                            enabled = !isDemo,
                            label = { Text(option.replaceFirstChar { it.uppercase() }) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = BrandPurple,
                                selectedLabelColor = White
                            )
                        )
                    }
                }
            }

            item { Spacer(Modifier.height(8.dp)) }
            item { SettingsSectionLabel("Notifications") }
            if (isDemo) {
                item {
                    Text(
                        "Demo account: notification settings are read-only.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }
            }

            item {
                SettingsToggleRow(
                    icon = Icons.Default.Email,
                    label = "Email notifications",
                    description = "Receive email notifications for activity",
                    checked = emailNotifications,
                    onCheckedChange = { if (!isDemo) emailNotifications = it },
                    switchesEnabled = !isDemo
                )
            }

            item { SettingsSectionLabel("Push notifications") }

            if (!osNotificationsEnabled) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.NotificationsOff, contentDescription = null, tint = TextMuted, modifier = Modifier.size(18.dp))
                        Text("Notifications are disabled in device settings.", style = MaterialTheme.typography.bodySmall, color = TextMuted, modifier = Modifier.weight(1f))
                        TextButton(onClick = {
                            context.startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                                putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                            })
                        }) { Text("Enable", color = BrandPurple) }
                    }
                }
            }

            val pushEnabled = !isDemo && osNotificationsEnabled
            item {
                SettingsToggleRow(
                    icon = Icons.Default.Message,
                    label = "Direct messages",
                    description = "New message notifications",
                    checked = pushMessages,
                    onCheckedChange = { if (pushEnabled) pushMessages = it },
                    switchesEnabled = pushEnabled
                )
            }
            item {
                SettingsToggleRow(
                    icon = Icons.Default.Comment,
                    label = "Comments & mentions",
                    description = "Comments, replies, and mentions",
                    checked = pushComments,
                    onCheckedChange = { if (pushEnabled) pushComments = it },
                    switchesEnabled = pushEnabled
                )
            }
            item {
                SettingsToggleRow(
                    icon = Icons.Default.Favorite,
                    label = "Likes",
                    description = "Likes on your notes and comments",
                    checked = pushLikes,
                    onCheckedChange = { if (pushEnabled) pushLikes = it },
                    switchesEnabled = pushEnabled
                )
            }
            item {
                SettingsToggleRow(
                    icon = Icons.Default.PersonAdd,
                    label = "Friend requests",
                    description = "Friend requests and acceptances",
                    checked = pushFriendRequests,
                    onCheckedChange = { if (pushEnabled) pushFriendRequests = it },
                    switchesEnabled = pushEnabled
                )
            }
            item {
                SettingsToggleRow(
                    icon = Icons.Default.Task,
                    label = "Task assignments",
                    description = "When a task is assigned to you",
                    checked = pushTasks,
                    onCheckedChange = { if (pushEnabled) pushTasks = it },
                    switchesEnabled = pushEnabled
                )
            }
            item {
                SettingsToggleRow(
                    icon = Icons.Default.Share,
                    label = "Shared notes & content",
                    description = "When someone shares content with you",
                    checked = pushSharedContent,
                    onCheckedChange = { if (pushEnabled) pushSharedContent = it },
                    switchesEnabled = pushEnabled
                )
            }

            item { Spacer(Modifier.height(16.dp)) }
            item { SettingsSectionLabel("App") }
            item {
                var replayLoading by remember { mutableStateOf(false) }
                Surface(
                    color = White,
                    shape = MaterialTheme.shapes.small,
                    tonalElevation = 0.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(Icons.Default.Replay, contentDescription = null, tint = BrandPurple, modifier = Modifier.size(20.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Replay feature tour", style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                            Text("Walk through the app tour again any time.", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                        }
                        TextButton(
                            onClick = {
                                if (!replayLoading) {
                                    replayLoading = true
                                    viewModel.replayTour { onReplayTour(); replayLoading = false }
                                }
                            },
                            enabled = !replayLoading && !isDemo,
                        ) {
                            Text(if (replayLoading) "Resetting…" else "Replay", color = BrandPurple)
                        }
                    }
                }
            }

            item { Spacer(Modifier.height(16.dp)) }

            if (!isDemo) {
                item {
                    ContinuumButton(
                        text = if (state.isSaving) "Saving…" else "Save changes",
                        onClick = { saveSettings() },
                        enabled = !state.isSaving,
                        loading = state.isSaving,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            state.successMessage?.let { msg ->
                item {
                    Text(
                        text = msg,
                        color = SuccessGreen,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }

            state.error?.let { err ->
                item {
                    Text(
                        text = err,
                        color = ErrorRed,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun SettingsSectionLabel(text: String) {
    Text(
        text = text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = TextMuted,
        modifier = Modifier.padding(vertical = 4.dp)
    )
}

@Composable
private fun SettingsToggleRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    switchesEnabled: Boolean = true
) {
    Surface(
        color = White,
        shape = MaterialTheme.shapes.small,
        tonalElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = BrandPurple, modifier = Modifier.size(20.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(label, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                Text(description, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange,
                enabled = switchesEnabled,
                colors = SwitchDefaults.colors(checkedThumbColor = White, checkedTrackColor = BrandPurple)
            )
        }
    }
}
