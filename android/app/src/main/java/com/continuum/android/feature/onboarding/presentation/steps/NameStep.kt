package com.continuum.android.feature.onboarding.presentation.steps

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private val USERNAME_REGEX = Regex("^[a-zA-Z0-9_]{3,30}$")

private enum class UsernameCheckState { IDLE, CHECKING, AVAILABLE, TAKEN, INVALID }

@Composable
fun NameStep(
    profile: Profile,
    profileRepository: ProfileRepository,
    onContinue: () -> Unit,
    onSkip: () -> Unit,
) {
    var firstName by remember { mutableStateOf(profile.firstName) }
    var lastName  by remember { mutableStateOf(profile.lastName) }
    var username  by remember { mutableStateOf(profile.username) }
    var firstNameError by remember { mutableStateOf<String?>(null) }
    var lastNameError  by remember { mutableStateOf<String?>(null) }
    var usernameCheck  by remember { mutableStateOf(UsernameCheckState.IDLE) }
    var savedUsername  by remember { mutableStateOf(profile.username) }
    var loading        by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    var debounceJob by remember { mutableStateOf<Job?>(null) }

    fun checkUsername(value: String) {
        if (value == savedUsername) { usernameCheck = UsernameCheckState.IDLE; return }
        if (!USERNAME_REGEX.matches(value)) { usernameCheck = UsernameCheckState.INVALID; return }
        usernameCheck = UsernameCheckState.CHECKING
        scope.launch {
            val result = profileRepository.updateUsername(value)
            usernameCheck = if (result.isSuccess) {
                savedUsername = value
                UsernameCheckState.AVAILABLE
            } else {
                if (result.exceptionOrNull()?.message?.contains("409") == true ||
                    result.exceptionOrNull()?.message?.contains("taken") == true
                ) UsernameCheckState.TAKEN else UsernameCheckState.IDLE
            }
        }
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            "Confirm your name and username",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "This is how others will see you on Continuum.",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
        )
        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = firstName,
            onValueChange = { firstName = it; firstNameError = null },
            label = { Text("First name") },
            isError = firstNameError != null,
            supportingText = firstNameError?.let { { Text(it, color = ErrorRed) } },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
            modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp),
            colors = onboardingTextFieldColors(),
        )
        OutlinedTextField(
            value = lastName,
            onValueChange = { lastName = it; lastNameError = null },
            label = { Text("Last name") },
            isError = lastNameError != null,
            supportingText = lastNameError?.let { { Text(it, color = ErrorRed) } },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
            modifier = Modifier.fillMaxWidth().padding(bottom = 4.dp),
            colors = onboardingTextFieldColors(),
        )
        OutlinedTextField(
            value = username,
            onValueChange = { v ->
                username = v
                usernameCheck = UsernameCheckState.IDLE
                debounceJob?.cancel()
                debounceJob = scope.launch { delay(600); checkUsername(v) }
            },
            onValueChangeFinished = { /* handled in onValueChange */ },
            label = { Text("Username") },
            isError = usernameCheck == UsernameCheckState.TAKEN || usernameCheck == UsernameCheckState.INVALID,
            supportingText = {
                when (usernameCheck) {
                    UsernameCheckState.CHECKING   -> Text("Checking availability…", color = TextMuted)
                    UsernameCheckState.AVAILABLE  -> Text("✓ Username is available", color = SuccessGreen)
                    UsernameCheckState.TAKEN      -> Text("Username is already taken", color = ErrorRed)
                    UsernameCheckState.INVALID    -> Text("3–30 characters: letters, numbers, underscores only", color = ErrorRed)
                    UsernameCheckState.IDLE       -> Text("Letters, numbers, and underscores only. 3–30 characters.", color = TextMuted)
                }
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            modifier = Modifier.fillMaxWidth(),
            colors = onboardingTextFieldColors(),
        )

        Spacer(Modifier.height(16.dp))

        val canSave = usernameCheck != UsernameCheckState.TAKEN &&
                usernameCheck != UsernameCheckState.INVALID &&
                usernameCheck != UsernameCheckState.CHECKING &&
                !loading

        ContinuumButton(
            text = when {
                loading -> "Saving…"
                usernameCheck == UsernameCheckState.CHECKING -> "Checking username…"
                else -> "Save & Continue"
            },
            enabled = canSave,
            loading = loading,
            onClick = {
                var hasError = false
                if (firstName.isBlank()) { firstNameError = "First name is required."; hasError = true }
                if (lastName.isBlank())  { lastNameError  = "Last name is required.";  hasError = true }
                if (hasError) return@ContinuumButton

                loading = true
                scope.launch {
                    val updates = buildMap<String, String> {
                        if (firstName.trim() != profile.firstName) put("firstName", firstName.trim())
                        if (lastName.trim()  != profile.lastName)  put("lastName",  lastName.trim())
                    }
                    if (updates.isNotEmpty()) profileRepository.updateProfileMultipart(updates)
                    if (username != savedUsername) {
                        val result = profileRepository.updateUsername(username)
                        if (result.isFailure) {
                            usernameCheck = UsernameCheckState.TAKEN
                            loading = false
                            return@launch
                        }
                    }
                    loading = false
                    onContinue()
                }
            },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) {
            Text("Skip", color = TextMuted)
        }
    }
}

// Convenience so every OutlinedTextField in onboarding uses BrandPurple focus colour
@Composable
fun onboardingTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = BrandPurple,
    focusedLabelColor = BrandPurple,
    cursorColor = BrandPurple,
)
