package com.continuum.android.feature.onboarding.presentation.steps

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*

@Composable
fun WelcomeStep(onContinue: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text("👋", style = MaterialTheme.typography.displaySmall)
        Spacer(Modifier.height(12.dp))
        Text(
            "Welcome to Continuum",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            "Let's spend 2 minutes setting up your account and showing you around. You can skip anything.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
        )
        Spacer(Modifier.height(28.dp))
        ContinuumButton(
            text = "Let's go",
            onClick = onContinue,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
