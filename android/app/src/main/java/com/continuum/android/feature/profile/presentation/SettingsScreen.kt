package com.continuum.android.feature.profile.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.delay
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.components.MinimalTopBar
import com.continuum.android.core.ui.theme.*

@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val profile = state.profile

    var emailNotifications by remember { mutableStateOf(true) }
    var pushNotifications by remember { mutableStateOf(true) }
    var activityVisibility by remember { mutableStateOf("friends") }

    LaunchedEffect(Unit) { viewModel.load() }

    LaunchedEffect(profile) {
        val p = profile ?: return@LaunchedEffect
        emailNotifications = p.emailNotifications
        pushNotifications = p.pushNotifications
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
                "settings.emailNotifications" to emailNotifications.toString(),
                "settings.pushNotifications" to pushNotifications.toString(),
                "settings.activityVisibility" to activityVisibility
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
            item {
                SettingsToggleRow(
                    icon = Icons.Default.Notifications,
                    label = "Push notifications",
                    description = "Receive push notifications on this device",
                    checked = pushNotifications,
                    onCheckedChange = { if (!isDemo) pushNotifications = it },
                    switchesEnabled = !isDemo
                )
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
