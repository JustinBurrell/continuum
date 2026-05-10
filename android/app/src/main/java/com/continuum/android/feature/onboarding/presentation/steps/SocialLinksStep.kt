package com.continuum.android.feature.onboarding.presentation.steps

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.continuum.android.core.network.friendlyError
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import kotlinx.coroutines.launch

@Composable
fun SocialLinksStep(
    profile: Profile,
    profileRepository: ProfileRepository,
    onContinue: () -> Unit,
    onSkip: () -> Unit,
) {
    var linkedinUrl      by remember { mutableStateOf(profile.linkedinUrl ?: "") }
    var instagramHandle  by remember { mutableStateOf(profile.instagramHandle ?: "") }
    var linkedinError    by remember { mutableStateOf<String?>(null) }
    var instagramError   by remember { mutableStateOf<String?>(null) }
    var generalError     by remember { mutableStateOf<String?>(null) }
    var loading          by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            "Add your social links",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "Both are optional — add them later from your Profile page any time.",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
        )
        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = linkedinUrl,
            onValueChange = { linkedinUrl = it; linkedinError = null },
            label = { Text("LinkedIn URL") },
            placeholder = { Text("https://linkedin.com/in/yourname") },
            isError = linkedinError != null,
            supportingText = {
                Text(
                    linkedinError ?: "e.g. https://linkedin.com/in/yourname",
                    color = if (linkedinError != null) ErrorRed else TextMuted,
                )
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Next),
            modifier = Modifier.fillMaxWidth(),
            colors = onboardingTextFieldColors(),
        )
        Spacer(Modifier.height(4.dp))
        OutlinedTextField(
            value = instagramHandle,
            onValueChange = { instagramHandle = it; instagramError = null },
            label = { Text("Instagram handle") },
            placeholder = { Text("yourhandle (without @)") },
            isError = instagramError != null,
            supportingText = {
                Text(
                    instagramError ?: "Letters, numbers, periods, underscores — no @",
                    color = if (instagramError != null) ErrorRed else TextMuted,
                )
            },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            modifier = Modifier.fillMaxWidth(),
            colors = onboardingTextFieldColors(),
        )

        generalError?.let {
            Spacer(Modifier.height(4.dp))
            Text(it, style = MaterialTheme.typography.bodySmall, color = ErrorRed)
        }

        Spacer(Modifier.height(16.dp))
        ContinuumButton(
            text = if (loading) "Saving…" else "Save & Continue",
            enabled = !loading,
            loading = loading,
            onClick = {
                val hasChanges = linkedinUrl != (profile.linkedinUrl ?: "") ||
                        instagramHandle != (profile.instagramHandle ?: "")
                if (!hasChanges) { onContinue(); return@ContinuumButton }

                loading = true
                generalError = null
                scope.launch {
                    val fields = mutableMapOf<String, String>()
                    if (linkedinUrl != (profile.linkedinUrl ?: ""))         fields["linkedinUrl"] = linkedinUrl
                    if (instagramHandle != (profile.instagramHandle ?: "")) fields["instagramHandle"] = instagramHandle

                    val result = profileRepository.updateProfileMultipart(fields)
                    loading = false
                    if (result.isSuccess) {
                        onContinue()
                    } else {
                        val msg = result.exceptionOrNull()
                            ?.let { friendlyError(it) }
                            ?: "Something went wrong. Please try again."
                        when {
                            msg.contains("linkedin", ignoreCase = true)   -> linkedinError = msg
                            msg.contains("instagram", ignoreCase = true)  -> instagramError = msg
                            else                                           -> generalError = msg
                        }
                    }
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
