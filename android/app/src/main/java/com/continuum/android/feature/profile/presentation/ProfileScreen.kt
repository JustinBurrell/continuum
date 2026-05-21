package com.continuum.android.feature.profile.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import com.continuum.android.R
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil3.compose.AsyncImage
import com.continuum.android.core.ui.LocalScrollToTopNotifier
import kotlinx.coroutines.flow.MutableStateFlow
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.profile.domain.Profile
import com.continuum.android.feature.profile.domain.Session
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun ProfileScreen(
    onLogoClick: (() -> Unit)? = null,
    onEditProfile: () -> Unit,
    onSettings: () -> Unit,
    onLogout: () -> Unit,
    onFriends: () -> Unit = {},
    onMessages: () -> Unit = {},
    onNotifications: () -> Unit = {},
    onActivity: () -> Unit = {},
    onCalendar: () -> Unit = {},
    onTasks: () -> Unit = {},
    onResumes: () -> Unit = {},
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val uriHandler = LocalUriHandler.current
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showPasswordDialog by remember { mutableStateOf(false) }
    var showLogoutAllDialog by remember { mutableStateOf(false) }
    val listState = rememberLazyListState()
    val scrollToTopNotifier = LocalScrollToTopNotifier.current
    val scrollToTopCount by remember(scrollToTopNotifier) {
        scrollToTopNotifier?.counter ?: MutableStateFlow(0)
    }.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { viewModel.load() }
    LaunchedEffect(scrollToTopCount) {
        if (scrollToTopCount > 0) listState.animateScrollToItem(0)
    }

    LaunchedEffect(state.successMessage, state.error) {
        if (state.successMessage != null || state.error != null) {
            viewModel.clearMessage()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        InlineScreenHeader(title = "Profile")

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
            state = listState,
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Pending deletion banner
            if (profile.pendingDeletion) {
                item {
                    Surface(
                        color = Color(0xFFFEF2F2),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Account scheduled for deletion", style = MaterialTheme.typography.labelMedium, color = ErrorRed)
                                val dateStr = profile.scheduledDeletionAt?.take(10) ?: "soon"
                                Text("Your account will be permanently deleted on $dateStr.", style = MaterialTheme.typography.bodySmall, color = ErrorRed)
                            }
                            TextButton(
                                onClick = { viewModel.restoreAccount() },
                                enabled = !state.restoreLoading && !profile.isDemo
                            ) {
                                Text(if (state.restoreLoading) "Restoring…" else "Restore", color = ErrorRed)
                            }
                        }
                    }
                }
            }

            // Email verification banner
            if (!profile.isEmailVerified && !profile.isDemo) {
                item {
                    Surface(
                        color = Color(0xFFFFFBEB),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Verify your email to unlock all features.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF92400E),
                                modifier = Modifier.weight(1f)
                            )
                            TextButton(onClick = { viewModel.sendVerificationEmail() }) {
                                Text(
                                    if (state.verificationSent) "Sent!" else "Send email",
                                    color = Color(0xFF92400E)
                                )
                            }
                        }
                    }
                }
            }

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
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = profile.fullName,
                            fontFamily = FrauncesFamily,
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = TextPrimary
                        )
                        if (profile.roles.isNotEmpty()) {
                            VerifiedRoleBadges(roles = profile.roles, expanded = false)
                        }
                    }
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
                    // Social links
                    if (!profile.linkedinUrl.isNullOrBlank() || !profile.instagramHandle.isNullOrBlank()) {
                        Spacer(Modifier.height(4.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            profile.linkedinUrl?.takeIf { it.isNotBlank() }?.let { url ->
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
                            profile.instagramHandle?.takeIf { it.isNotBlank() }?.let { handle ->
                                val cleanHandle = handle.removePrefix("@")
                                Surface(
                                    onClick = { runCatching { uriHandler.openUri("https://instagram.com/$cleanHandle") } },
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
                    Text(
                        text = "Joined ${formatShortDate(profile.createdAt)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            // Account section
            item {
                ProfileSection(title = "Account") {
                    if (!profile.isDemo) {
                        ProfileRow(icon = Icons.Default.Edit, label = "Edit Profile", onClick = onEditProfile)
                        HorizontalDivider(color = Border)
                        ProfileRow(icon = Icons.Default.Lock, label = "Change Password", onClick = { showPasswordDialog = true })
                        HorizontalDivider(color = Border)
                    }
                    ProfileRow(icon = Icons.Default.Settings, label = "Settings", onClick = onSettings)
                }
            }

            // Social section
            item {
                ProfileSection(title = "Social") {
                    ProfileRow(icon = Icons.Default.People, label = "Friends", onClick = onFriends)
                    HorizontalDivider(color = Border)
                    ProfileRow(icon = Icons.Default.ChatBubbleOutline, label = "Messages", onClick = onMessages)
                    HorizontalDivider(color = Border)
                    ProfileRow(icon = Icons.Default.Notifications, label = "Notifications", onClick = onNotifications)
                    HorizontalDivider(color = Border)
                    ProfileRow(icon = Icons.Default.NotificationsNone, label = "Activity", onClick = onActivity)
                    HorizontalDivider(color = Border)
                    ProfileRow(icon = Icons.Default.CalendarMonth, label = "Calendar", onClick = onCalendar)
                    HorizontalDivider(color = Border)
                    ProfileRow(icon = Icons.Default.CheckBox, label = "Tasks", onClick = onTasks)
                    HorizontalDivider(color = Border)
                    ProfileRow(icon = Icons.Default.Description, label = "Resumes", onClick = onResumes)
                }
            }

            // Google Account section
            item {
                ProfileSection(title = "Google Account") {
                    if (profile.isGoogleLinked) {
                        ProfileRow(
                            icon = Icons.Default.CheckCircle,
                            label = "Google linked",
                            tint = SuccessGreen,
                            onClick = {}
                        )
                        HorizontalDivider(color = Border)
                        ProfileRow(
                            icon = Icons.Default.LinkOff,
                            label = "Unlink Google",
                            tint = ErrorRed,
                            labelColor = ErrorRed,
                            onClick = { viewModel.unlinkGoogle() }
                        )
                    } else {
                        ProfileRow(
                            icon = Icons.Default.Link,
                            label = "Link Google Account",
                            tint = BrandPurple,
                            onClick = {}
                        )
                    }
                }
            }

            // Legal
            item {
                ProfileSection(title = "Legal") {
                    ProfileRow(icon = Icons.Default.Article, label = "Terms of Service", onClick = { uriHandler.openUri("https://usecontinuum.dev/terms") })
                    HorizontalDivider(color = Border)
                    ProfileRow(icon = Icons.Default.Shield, label = "Privacy Policy", onClick = { uriHandler.openUri("https://usecontinuum.dev/privacy") })
                }
            }

            // Active Sessions
            if (!profile.isDemo) {
                item {
                    ProfileSection(title = "Active Sessions") {
                        if (state.sessionsLoading) {
                            Text("Loading sessions...", style = MaterialTheme.typography.bodySmall, color = TextMuted, modifier = Modifier.padding(16.dp))
                        } else if (state.sessions.isEmpty()) {
                            Text("No active sessions found.", style = MaterialTheme.typography.bodySmall, color = TextMuted, modifier = Modifier.padding(16.dp))
                        } else {
                            Column {
                                state.sessions.forEach { session ->
                                    SessionRow(
                                        session = session,
                                        onRevoke = { viewModel.revokeSession(session.id) }
                                    )
                                    if (session != state.sessions.last()) {
                                        HorizontalDivider(color = Border)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Danger Zone
            if (!profile.isDemo) {
                item {
                    ProfileSection(title = "Danger Zone") {
                        ProfileRow(
                            icon = Icons.AutoMirrored.Filled.ExitToApp,
                            label = "Sign out all devices",
                            tint = ErrorRed,
                            labelColor = ErrorRed,
                            onClick = { showLogoutAllDialog = true }
                        )
                        HorizontalDivider(color = Border)
                        ProfileRow(
                            icon = Icons.Default.DeleteForever,
                            label = "Delete Account",
                            tint = ErrorRed,
                            labelColor = ErrorRed,
                            onClick = { showDeleteDialog = true }
                        )
                    }
                }
            }

            // Logout
            item {
                TextButton(
                    onClick = { viewModel.logout(onLogout) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null, tint = ErrorRed)
                    Spacer(Modifier.width(8.dp))
                    Text("Log out", color = ErrorRed, style = MaterialTheme.typography.labelLarge)
                }
            }
        }
    }

    // Delete account dialog
    if (showDeleteDialog) {
        DeleteAccountDialog(
            username = state.profile?.username ?: "",
            isLoading = state.deleteLoading,
            onDismiss = { showDeleteDialog = false },
            onConfirm = {
                viewModel.deleteAccount(onLogout)
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

    // Logout all confirmation
    if (showLogoutAllDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutAllDialog = false },
            title = { Text("Sign out of all devices") },
            text = { Text("You will be signed out of all devices and will need to log in again.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutAllDialog = false
                        viewModel.logoutAll(onLogout)
                    },
                    enabled = !state.logoutAllLoading
                ) {
                    Text(if (state.logoutAllLoading) "Signing out…" else "Sign out all", color = ErrorRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutAllDialog = false }) { Text("Cancel") }
            }
        )
    }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

@Composable
private fun SessionRow(session: Session, onRevoke: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(session.deviceId, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                if (session.isCurrent) {
                    Surface(
                        color = PurpleTint,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            "This device",
                            style = MaterialTheme.typography.labelSmall,
                            color = BrandPurple,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp)
                        )
                    }
                }
            }
            val signedIn = "Signed in ${formatShortDate(session.createdAt)}"
            val lastActive = session.lastUsedAt?.let { " · Last active ${formatRelativeTime(it)}" } ?: ""
            val location = session.ipLocation?.let { " · $it" } ?: ""
            Text(
                "$signedIn$lastActive$location",
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted
            )
        }
        if (!session.isCurrent) {
            IconButton(onClick = onRevoke, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Default.Delete, contentDescription = "Revoke session", tint = ErrorRed, modifier = Modifier.size(16.dp))
            }
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
    tint: Color = BrandPurple,
    labelColor: Color = TextPrimary,
    onClick: () -> Unit
) {
    Surface(onClick = onClick, color = Color.Transparent) {
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
    var confirmPw by remember { mutableStateOf("") }
    var showCurrent by remember { mutableStateOf(false) }
    var showNew by remember { mutableStateOf(false) }

    val hasLetter = newPw.any { it.isLetter() }
    val hasDigit = newPw.any { it.isDigit() }
    val hasSpecial = newPw.any { !it.isLetterOrDigit() }
    val isLongEnough = newPw.length >= 8
    val passwordsMatch = newPw == confirmPw && confirmPw.isNotEmpty()
    val isValid = current.isNotBlank() && isLongEnough && hasLetter && hasDigit && hasSpecial && passwordsMatch

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change Password") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = current,
                    onValueChange = { current = it },
                    label = { Text("Current password *") },
                    singleLine = true,
                    visualTransformation = if (showCurrent) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { showCurrent = !showCurrent }) {
                            Icon(if (showCurrent) Icons.Default.VisibilityOff else Icons.Default.Visibility, "Toggle")
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                OutlinedTextField(
                    value = newPw,
                    onValueChange = { newPw = it },
                    label = { Text("New password *") },
                    singleLine = true,
                    visualTransformation = if (showNew) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { showNew = !showNew }) {
                            Icon(if (showNew) Icons.Default.VisibilityOff else Icons.Default.Visibility, "Toggle")
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                if (newPw.isNotEmpty()) {
                    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        PasswordReqLine("At least 8 characters", isLongEnough)
                        PasswordReqLine("Contains a letter", hasLetter)
                        PasswordReqLine("Contains a number", hasDigit)
                        PasswordReqLine("Contains a special character", hasSpecial)
                    }
                }
                OutlinedTextField(
                    value = confirmPw,
                    onValueChange = { confirmPw = it },
                    label = { Text("Confirm new password *") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    isError = confirmPw.isNotEmpty() && !passwordsMatch,
                    supportingText = if (confirmPw.isNotEmpty() && !passwordsMatch) {{ Text("Passwords do not match") }} else null,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
            }
        },
        confirmButton = {
            ContinuumButton(
                text = if (isSaving) "Saving..." else "Update password",
                onClick = { onSave(current, newPw) },
                enabled = isValid && !isSaving,
                loading = isSaving
            )
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
private fun PasswordReqLine(text: String, met: Boolean) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Icon(
            if (met) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (met) SuccessGreen else TextMuted,
            modifier = Modifier.size(14.dp)
        )
        Text(text, style = MaterialTheme.typography.bodySmall, color = if (met) SuccessGreen else TextMuted)
    }
}

@Composable
private fun DeleteAccountDialog(
    username: String,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var usernameInput by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPw by remember { mutableStateOf(false) }
    val usernameMatch = usernameInput.trim().equals(username, ignoreCase = true)

    AlertDialog(
        onDismissRequest = { if (!isLoading) onDismiss() },
        title = { Text("Delete Account", color = ErrorRed) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    "Your account will be scheduled for deletion in 30 days. All your data will be permanently removed.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
                Surface(
                    color = Color(0xFFFEF2F2),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        "After 30 days, this action is irreversible.",
                        style = MaterialTheme.typography.bodySmall,
                        color = ErrorRed,
                        modifier = Modifier.padding(10.dp)
                    )
                }
                OutlinedTextField(
                    value = usernameInput,
                    onValueChange = { usernameInput = it },
                    label = { Text("Type your username to confirm") },
                    placeholder = { Text(username) },
                    singleLine = true,
                    isError = usernameInput.isNotEmpty() && !usernameMatch,
                    supportingText = if (usernameInput.isNotEmpty() && !usernameMatch) {{ Text("Username does not match") }} else null,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Enter your password") },
                    singleLine = true,
                    visualTransformation = if (showPw) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { showPw = !showPw }) {
                            Icon(if (showPw) Icons.Default.VisibilityOff else Icons.Default.Visibility, "Toggle")
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(password) },
                enabled = usernameMatch && !isLoading,
            ) {
                Text(if (isLoading) "Deleting…" else "Delete my account", color = if (usernameMatch) ErrorRed else TextMuted)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss, enabled = !isLoading) { Text("Cancel") }
        }
    )
}

private fun formatShortDate(isoDate: String): String {
    return try {
        val formats = listOf("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", "yyyy-MM-dd'T'HH:mm:ss'Z'", "yyyy-MM-dd")
        var date: Date? = null
        for (fmt in formats) {
            try {
                date = SimpleDateFormat(fmt, Locale.US).apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }.parse(isoDate)
                if (date != null) break
            } catch (_: Exception) {}
        }
        date?.let { SimpleDateFormat("MMM d, yyyy", Locale.US).format(it) } ?: isoDate.take(10)
    } catch (_: Exception) { isoDate.take(10) }
}

private fun formatRelativeTime(isoDate: String): String {
    return try {
        val formats = listOf("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", "yyyy-MM-dd'T'HH:mm:ss'Z'")
        var date: Date? = null
        for (fmt in formats) {
            try {
                date = SimpleDateFormat(fmt, Locale.US).apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }.parse(isoDate)
                if (date != null) break
            } catch (_: Exception) {}
        }
        if (date == null) return isoDate.take(10)
        val diff = System.currentTimeMillis() - date.time
        val mins = diff / 60_000
        when {
            mins < 1 -> "just now"
            mins < 60 -> "${mins}m ago"
            mins < 1440 -> "${mins / 60}h ago"
            else -> "${mins / 1440}d ago"
        }
    } catch (_: Exception) { isoDate.take(10) }
}
