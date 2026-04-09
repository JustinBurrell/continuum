package com.continuum.android.feature.profile.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.AsyncImage
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.profile.domain.Profile

@Composable
fun ProfileScreen(
    onLogoClick: (() -> Unit)? = null,
    onEditProfile: () -> Unit,
    onSettings: () -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showPasswordDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { viewModel.load() }

    // Show snackbar for success/error messages
    LaunchedEffect(state.successMessage, state.error) {
        if (state.successMessage != null || state.error != null) {
            viewModel.clearMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        PurpleTopAppBar(title = "Profile", onLogoClick = onLogoClick)

        if (state.isLoading) {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                item { SkeletonLoader(Modifier.fillMaxWidth().height(120.dp)) }
                item { SkeletonLoader(Modifier.fillMaxWidth().height(200.dp)) }
                item { SkeletonLoader(Modifier.fillMaxWidth().height(160.dp)) }
            }
            return@Column
        }

        val profile = state.profile ?: return@Column

        LazyColumn(
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Avatar + name header
            item {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(modifier = Modifier.size(80.dp)) {
                        if (profile.avatarUrl != null) {
                            AsyncImage(
                                model = profile.avatarUrl,
                                contentDescription = profile.fullName,
                                modifier = Modifier.fillMaxSize().clip(CircleShape)
                            )
                        } else {
                            AvatarInitials(name = profile.fullName, modifier = Modifier.fillMaxSize())
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = profile.fullName,
                        fontFamily = FrauncesFamily,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = TextPrimary
                    )
                    Text(
                        text = "@${profile.username}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                    profile.bio?.takeIf { it.isNotBlank() }?.let { bio ->
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = bio,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                }
            }

            // Stats row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatTile("Notes", state.notesCount, Modifier.weight(1f))
                    StatTile("Friends", state.friendsCount, Modifier.weight(1f))
                }
            }

            // Account section
            item {
                ProfileSection(title = "Account") {
                    ProfileRow(
                        icon = Icons.Default.Edit,
                        label = "Edit Profile",
                        onClick = onEditProfile
                    )
                    HorizontalDivider(color = Border)
                    ProfileRow(
                        icon = Icons.Default.Lock,
                        label = "Change Password",
                        onClick = { showPasswordDialog = true }
                    )
                }
            }

            // Google Account section
            item {
                ProfileSection(title = "Google Account") {
                    ProfileRow(
                        icon = if (profile.isGoogleLinked) Icons.Default.CheckCircle else Icons.Default.Link,
                        label = if (profile.isGoogleLinked) "Google linked" else "Link Google Account",
                        tint = if (profile.isGoogleLinked) SuccessGreen else BrandPurple,
                        onClick = {}
                    )
                }
            }

            // Preferences section
            item {
                ProfileSection(title = "Preferences") {
                    ProfileRow(
                        icon = Icons.Default.Settings,
                        label = "Settings",
                        onClick = onSettings
                    )
                }
            }

            // Danger Zone
            item {
                ProfileSection(title = "Danger Zone") {
                    ProfileRow(
                        icon = Icons.Default.DeleteForever,
                        label = "Delete Account",
                        tint = ErrorRed,
                        labelColor = ErrorRed,
                        onClick = { showDeleteDialog = true }
                    )
                }
            }

            // Logout
            item {
                TextButton(
                    onClick = { viewModel.logout(onLogout) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Logout, contentDescription = null, tint = ErrorRed)
                    Spacer(Modifier.width(8.dp))
                    Text("Log out", color = ErrorRed, style = MaterialTheme.typography.labelLarge)
                }
            }
        }
    }

    // Delete account confirmation
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Account") },
            text = { Text("This action is permanent and cannot be undone. All your data will be deleted.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        viewModel.deleteAccount(onLogout)
                    }
                ) {
                    Text("Delete", color = ErrorRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Change password dialog
    if (showPasswordDialog) {
        ChangePasswordDialog(
            isSaving = state.isSaving,
            onDismiss = { showPasswordDialog = false },
            onSave = { current, new ->
                viewModel.changePassword(current, new)
                showPasswordDialog = false
            }
        )
    }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

@Composable
private fun StatTile(label: String, count: Int, modifier: Modifier = Modifier) {
    ContinuumCard(modifier = modifier) {
        Column(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "$count",
                fontFamily = FrauncesFamily,
                fontWeight = FontWeight.Black,
                fontSize = 24.sp,
                color = BrandPurple
            )
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }
    }
}

@Composable
private fun ProfileSection(title: String, content: @Composable () -> Unit) {
    Column {
        Text(
            text = title.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = TextMuted,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        ContinuumCard(modifier = Modifier.fillMaxWidth()) {
            content()
        }
    }
}

@Composable
private fun ProfileRow(
    icon: ImageVector,
    label: String,
    tint: androidx.compose.ui.graphics.Color = BrandPurple,
    labelColor: androidx.compose.ui.graphics.Color = TextPrimary,
    onClick: () -> Unit
) {
    Surface(onClick = onClick, color = androidx.compose.ui.graphics.Color.Transparent) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = tint, modifier = Modifier.size(20.dp))
            Text(text = label, style = MaterialTheme.typography.bodyMedium, color = labelColor, modifier = Modifier.weight(1f))
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = TextMuted, modifier = Modifier.size(18.dp))
        }
    }
}

@Composable
private fun ChangePasswordDialog(
    isSaving: Boolean,
    onDismiss: () -> Unit,
    onSave: (String, String) -> Unit
) {
    var current by remember { mutableStateOf("") }
    var newPw by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change Password") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                ContinuumTextField(value = current, onValueChange = { current = it }, label = "Current password", placeholder = "••••••••")
                ContinuumTextField(value = newPw, onValueChange = { newPw = it }, label = "New password", placeholder = "••••••••")
            }
        },
        confirmButton = {
            ContinuumButton(
                text = if (isSaving) "Saving..." else "Save",
                onClick = { onSave(current, newPw) },
                enabled = current.isNotBlank() && newPw.length >= 8 && !isSaving,
                loading = isSaving
            )
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}
