package com.continuum.android.feature.onboarding.presentation.steps

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*

@Composable
fun DoneSlide(
    isReplay: Boolean,
    onFinish: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("🎉", style = MaterialTheme.typography.displayMedium)
        Spacer(Modifier.height(16.dp))
        Text(
            if (isReplay) "Tour complete!" else "You're all set",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            if (isReplay)
                "You can replay the tour any time from your Profile page."
            else
                "Explore Continuum at your own pace. Everything is in the navigation bar whenever you need it.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(28.dp))
        ContinuumButton(
            text = "Go to Dashboard",
            onClick = onFinish,
            modifier = Modifier.fillMaxWidth(),
        )
    }
}
