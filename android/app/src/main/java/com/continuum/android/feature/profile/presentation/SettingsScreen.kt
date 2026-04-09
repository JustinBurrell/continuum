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
import com.continuum.android.core.ui.components.PurpleTopAppBar
import com.continuum.android.core.ui.theme.*

/**
 * Preferences screen. Stores settings in DataStore (or just locally in state
 * for now — persisting to backend would require PATCH /api/auth/me/profile).
 */
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit
) {
    var noteVisibilityPublic by remember { mutableStateOf(false) }
    var showActivityFeed     by remember { mutableStateOf(true) }
    var showFriendActivity   by remember { mutableStateOf(true) }

    Column(modifier = Modifier.fillMaxSize()) {
        PurpleTopAppBar(title = "Settings", onNavigateBack = onNavigateBack)

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                SettingsSectionLabel("Note Visibility")
            }
            item {
                SettingsToggleRow(
                    icon = Icons.Default.Public,
                    label = "Default notes public",
                    description = "New notes visible to friends by default",
                    checked = noteVisibilityPublic,
                    onCheckedChange = { noteVisibilityPublic = it }
                )
            }

            item { Spacer(Modifier.height(8.dp)) }
            item { SettingsSectionLabel("Activity Feed") }

            item {
                SettingsToggleRow(
                    icon = Icons.Default.Feed,
                    label = "Show activity feed",
                    description = "See what your friends are working on",
                    checked = showActivityFeed,
                    onCheckedChange = { showActivityFeed = it }
                )
            }
            item {
                SettingsToggleRow(
                    icon = Icons.Default.People,
                    label = "Share my activity",
                    description = "Let friends see your notes and flashcards",
                    checked = showFriendActivity,
                    onCheckedChange = { showFriendActivity = it }
                )
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
    onCheckedChange: (Boolean) -> Unit
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
                colors = SwitchDefaults.colors(checkedThumbColor = White, checkedTrackColor = BrandPurple)
            )
        }
    }
}
