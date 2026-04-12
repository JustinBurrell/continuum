package com.continuum.android.feature.profile.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

private val linkedinPattern = Regex("^https://(www\\.)?linkedin\\.com/in/")
private val instagramPattern = Regex("^@?[a-zA-Z0-9._]{1,30}$")
private val usernamePattern = Regex("^[a-zA-Z0-9_-]{3,30}$")

@Composable
fun EditProfileScreen(
    onNavigateBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val profile = state.profile

    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var bio by remember { mutableStateOf("") }
    var linkedinUrl by remember { mutableStateOf("") }
    var instagramHandle by remember { mutableStateOf("") }
    var activityVisibility by remember { mutableStateOf("friends") }
    var username by remember { mutableStateOf("") }

    var linkedinError by remember { mutableStateOf<String?>(null) }
    var instagramError by remember { mutableStateOf<String?>(null) }
    var usernameError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) { viewModel.load() }

    LaunchedEffect(profile) {
        val p = profile ?: return@LaunchedEffect
        firstName = p.firstName
        lastName = p.lastName
        bio = p.bio.orEmpty()
        linkedinUrl = p.linkedinUrl.orEmpty()
        instagramHandle = p.instagramHandle.orEmpty()
        activityVisibility = p.activityVisibility.ifBlank { "friends" }
        username = p.username
    }

    LaunchedEffect(state.successMessage) {
        if (state.successMessage != null) {
            viewModel.clearMessage()
            onNavigateBack()
        }
    }

    fun validateAndSave() {
        linkedinError = if (linkedinUrl.isNotBlank() && !linkedinPattern.containsMatchIn(linkedinUrl.trim()))
            "Must start with https://linkedin.com/in/" else null
        instagramError = if (instagramHandle.isNotBlank() && !instagramPattern.matches(instagramHandle.trim()))
            "1–30 chars: letters, numbers, periods, underscores" else null

        if (linkedinError != null || instagramError != null) return

        val fields = mutableMapOf(
            "firstName" to firstName,
            "lastName" to lastName,
            "bio" to bio,
            "linkedinUrl" to linkedinUrl,
            "instagramHandle" to instagramHandle,
            "settings.activityVisibility" to activityVisibility
        )
        viewModel.updateProfileFields(fields)
    }

    fun validateAndSaveUsername() {
        usernameError = when {
            username.isBlank() -> "Username is required"
            !usernamePattern.matches(username) -> "3–30 chars: letters, numbers, _ or -"
            else -> null
        }
        if (usernameError != null) return
        viewModel.updateUsername(username)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        MinimalTopBar(
            title = "Edit Profile",
            onNavigateBack = onNavigateBack
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (state.isLoading && profile == null) {
                Box(Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandPurple)
                }
            }

            if (profile?.isDemo == true) {
                Text(
                    "Profile editing is not available on the demo account. Create a free account to customize your profile.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                ContinuumButton(
                    text = "Go back",
                    onClick = onNavigateBack,
                    modifier = Modifier.fillMaxWidth(),
                    variant = ContinuumButtonVariant.Secondary
                )
                return@Column
            }

            Text("PERSONAL INFO", style = MaterialTheme.typography.labelSmall, color = TextMuted)

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ContinuumTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    label = "First name *",
                    placeholder = "First",
                    modifier = Modifier.weight(1f)
                )
                ContinuumTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    label = "Last name *",
                    placeholder = "Last",
                    modifier = Modifier.weight(1f)
                )
            }

            ContinuumTextField(
                value = bio,
                onValueChange = { bio = it },
                label = "Bio",
                placeholder = "Tell people about yourself...",
                modifier = Modifier.fillMaxWidth()
            )

            Column {
                ContinuumTextField(
                    value = linkedinUrl,
                    onValueChange = { linkedinUrl = it; linkedinError = null },
                    label = "LinkedIn URL",
                    placeholder = "https://linkedin.com/in/yourprofile",
                    modifier = Modifier.fillMaxWidth()
                )
                linkedinError?.let {
                    Text(it, color = ErrorRed, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp))
                }
            }

            Column {
                ContinuumTextField(
                    value = instagramHandle,
                    onValueChange = { instagramHandle = it; instagramError = null },
                    label = "Instagram handle",
                    placeholder = "yourhandle",
                    modifier = Modifier.fillMaxWidth()
                )
                instagramError?.let {
                    Text(it, color = ErrorRed, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp))
                }
            }

            Text("ACTIVITY VISIBILITY", style = MaterialTheme.typography.labelSmall, color = TextMuted)

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("private" to "Private", "friends" to "Friends", "public" to "Public").forEach { (value, label) ->
                    FilterChip(
                        selected = activityVisibility == value,
                        onClick = { activityVisibility = value },
                        label = { Text(label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandPurple,
                            selectedLabelColor = White
                        )
                    )
                }
            }

            ContinuumButton(
                text = if (state.isSaving) "Saving..." else "Save changes",
                onClick = { validateAndSave() },
                enabled = firstName.isNotBlank() && lastName.isNotBlank() && !state.isSaving,
                loading = state.isSaving,
                modifier = Modifier.fillMaxWidth()
            )

            HorizontalDivider(color = Border, modifier = Modifier.padding(vertical = 8.dp))

            Text("USERNAME", style = MaterialTheme.typography.labelSmall, color = TextMuted)

            Column {
                ContinuumTextField(
                    value = username,
                    onValueChange = { username = it; usernameError = null },
                    label = "Username",
                    placeholder = "your_username",
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    "3–30 characters. Letters, numbers, underscores and hyphens only.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted,
                    modifier = Modifier.padding(top = 4.dp)
                )
                usernameError?.let {
                    Text(it, color = ErrorRed, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp))
                }
            }

            ContinuumButton(
                text = "Update username",
                onClick = { validateAndSaveUsername() },
                enabled = username.isNotBlank() && !state.isSaving,
                loading = state.isSaving,
                modifier = Modifier.fillMaxWidth()
            )

            if (state.error != null) {
                Text(
                    text = state.error!!,
                    color = ErrorRed,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(Modifier.height(32.dp))
        }
    }
}
