package com.continuum.android.feature.onboarding.presentation.steps

import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.net.toUri
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import kotlinx.coroutines.launch

@Composable
fun GoogleDriveStep(
    profile: Profile,
    profileRepository: ProfileRepository,
    apiBaseUrl: String,
    onContinue: () -> Unit,
    onSkip: () -> Unit,
) {
    // Auto-skip if already linked
    LaunchedEffect(profile.isGoogleLinked) {
        if (profile.isGoogleLinked) onContinue()
    }

    var linking by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    Column(modifier = Modifier.fillMaxWidth()) {
        Text("🔗", style = MaterialTheme.typography.displaySmall)
        Spacer(Modifier.height(12.dp))
        Text(
            "Connect your Google account",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Linking Google lets you sign in without a password and import your Google Docs directly as notes.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
        )
        Spacer(Modifier.height(6.dp))
        Text(
            "You can also do this later from your Profile → Integrations.",
            style = MaterialTheme.typography.bodySmall,
            color = TextMuted,
        )
        Spacer(Modifier.height(24.dp))

        ContinuumButton(
            text = if (linking) "Opening browser…" else "Connect Google",
            enabled = !linking,
            loading = linking,
            onClick = {
                linking = true
                val intent = CustomTabsIntent.Builder().build()
                intent.launchUrl(context, "$apiBaseUrl/api/auth/google?source=android-linking".toUri())
            },
            modifier = Modifier.fillMaxWidth(),
        )

        // ON_RESUME fires when the CCT closes (deep link auto-close or user back-press).
        // Re-check the profile here instead of using a fixed delay.
        LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
            if (linking) {
                scope.launch {
                    val refreshed = profileRepository.getProfile().getOrNull()
                    linking = false
                    if (refreshed?.isGoogleLinked == true) onContinue()
                }
            }
        }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) {
            Text("Skip for now", color = TextMuted)
        }
    }
}
