package com.continuum.android.feature.onboarding.presentation.steps

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.onboarding.TourStepConfig

@Composable
fun TourStepContent(
    config: TourStepConfig,
    onNext: () -> Unit,
    onSkipTour: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        // Section badge
        Box(
            modifier = Modifier
                .background(BrandPurple.copy(alpha = 0.08f), RoundedCornerShape(20.dp))
                .padding(horizontal = 12.dp, vertical = 4.dp)
        ) {
            Text(
                config.sectionName.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = BrandPurple,
                letterSpacing = androidx.compose.ui.unit.TextUnit(0.06f, androidx.compose.ui.unit.TextUnitType.Em),
            )
        }

        Spacer(Modifier.height(12.dp))
        Text(
            config.heading,
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
        )
        Spacer(Modifier.height(8.dp))
        Text(
            config.description,
            style = MaterialTheme.typography.bodyMedium,
            color = TextSecondary,
        )
        Spacer(Modifier.height(28.dp))

        ContinuumButton(
            text = "Next",
            onClick = onNext,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onSkipTour, modifier = Modifier.fillMaxWidth()) {
            Text("Skip tour", color = TextMuted)
        }
    }
}
