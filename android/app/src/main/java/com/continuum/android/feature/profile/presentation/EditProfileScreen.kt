package com.continuum.android.feature.profile.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

@Composable
fun EditProfileScreen(
    onNavigateBack: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val profile = state.profile

    var firstName by remember(profile) { mutableStateOf(profile?.firstName ?: "") }
    var lastName  by remember(profile) { mutableStateOf(profile?.lastName ?: "") }
    var username  by remember(profile) { mutableStateOf(profile?.username ?: "") }
    var bio       by remember(profile) { mutableStateOf(profile?.bio ?: "") }

    LaunchedEffect(state.successMessage) {
        if (state.successMessage != null) {
            viewModel.clearMessage()
            onNavigateBack()
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        PurpleTopAppBar(
            title = "Edit Profile",
            onNavigateBack = onNavigateBack,
            actions = {
                TextButton(
                    onClick = { viewModel.updateProfile(firstName, lastName, username, bio) },
                    enabled = !state.isSaving
                ) {
                    Text(if (state.isSaving) "Saving..." else "Save", color = White)
                }
            }
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                ContinuumTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    label = "First name",
                    placeholder = "First",
                    modifier = Modifier.weight(1f)
                )
                ContinuumTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    label = "Last name",
                    placeholder = "Last",
                    modifier = Modifier.weight(1f)
                )
            }

            ContinuumTextField(
                value = username,
                onValueChange = { username = it },
                label = "Username",
                placeholder = "username",
                modifier = Modifier.fillMaxWidth()
            )

            ContinuumTextField(
                value = bio,
                onValueChange = { bio = it },
                label = "Bio",
                placeholder = "Tell people about yourself...",
                modifier = Modifier.fillMaxWidth()
            )

            if (state.error != null) {
                Text(
                    text = state.error!!,
                    color = ErrorRed,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
