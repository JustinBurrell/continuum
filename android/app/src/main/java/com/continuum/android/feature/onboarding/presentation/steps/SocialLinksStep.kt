package com.continuum.android.feature.onboarding.presentation.steps

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
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
            onValueChange = { linkedinUrl = it },
            label = { Text("LinkedIn URL") },
            placeholder = { Text("https://linkedin.com/in/yourname") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri, imeAction = ImeAction.Next),
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            colors = onboardingTextFieldColors(),
        )
        OutlinedTextField(
            value = instagramHandle,
            onValueChange = { instagramHandle = it },
            label = { Text("Instagram handle") },
            placeholder = { Text("yourhandle (without @)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
            modifier = Modifier.fillMaxWidth(),
            colors = onboardingTextFieldColors(),
        )

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
                scope.launch {
                    val fields = mutableMapOf<String, String>()
                    if (linkedinUrl != (profile.linkedinUrl ?: ""))       fields["linkedinUrl"] = linkedinUrl
                    if (instagramHandle != (profile.instagramHandle ?: "")) fields["instagramHandle"] = instagramHandle
                    runCatching { profileRepository.updateProfileMultipart(fields) }
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
