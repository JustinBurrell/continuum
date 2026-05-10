package com.continuum.android.feature.onboarding.presentation.steps

import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.net.toUri
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun IntegrationsStep(
    profile: Profile,
    profileRepository: ProfileRepository,
    apiBaseUrl: String,
    onContinue: () -> Unit,
    onSkip: () -> Unit,
) {
    var linking by remember { mutableStateOf(false) }
    val isGoogleConnected = profile.isGoogleLinked
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            "Connect your tools",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "Power up Continuum with the apps you already use. Add more later from Profile → Integrations.",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
        )
        Spacer(Modifier.height(20.dp))

        // Google Drive card
        Surface(
            shape = RoundedCornerShape(10.dp),
            border = BorderStroke(1.dp, if (isGoogleConnected) SuccessGreen.copy(alpha = 0.4f) else Border),
            color = if (isGoogleConnected) SuccessGreen.copy(alpha = 0.04f) else White,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                // Icon
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    modifier = Modifier.size(40.dp),
                ) {
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                        Text("📁", fontSize = 20.sp)
                    }
                }

                // Text
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        "Google Drive",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary,
                    )
                    Text(
                        "Import Google Docs directly as notes",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                    )
                }

                // Action
                if (isGoogleConnected) {
                    Text("✓ Connected", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = SuccessGreen)
                } else {
                    Button(
                        onClick = {
                            linking = true
                            val intent = CustomTabsIntent.Builder().build()
                            intent.launchUrl(context, "$apiBaseUrl/api/auth/google".toUri())
                            scope.launch {
                                delay(1_000)
                                val refreshed = profileRepository.getProfile().getOrNull()
                                linking = false
                                if (refreshed?.isGoogleLinked == true) onContinue()
                            }
                        },
                        enabled = !linking,
                        colors = ButtonDefaults.buttonColors(containerColor = BrandPurple),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                    ) {
                        Text(
                            if (linking) "Opening…" else "Connect",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }
        }

        // Additional integration cards (Canvas LMS, etc.) slot here

        Spacer(Modifier.height(20.dp))
        ContinuumButton(
            text = if (isGoogleConnected) "Continue" else "Save & Continue",
            onClick = onContinue,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) {
            Text("Skip for now", color = TextMuted)
        }
    }
}
