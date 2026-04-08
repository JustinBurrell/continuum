package com.continuum.android.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.theme.ErrorRed
import com.continuum.android.core.ui.theme.ErrorRedBg
import com.continuum.android.core.ui.theme.PurpleTint
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.SuccessGreen
import com.continuum.android.core.ui.theme.SuccessGreenBg
import com.continuum.android.core.ui.theme.TextSecondary
import com.continuum.android.core.ui.theme.WarningAmber
import com.continuum.android.core.ui.theme.WarningAmberBg

enum class ApplicationStatus {
    Saved,
    Applied,
    Interview,
    Offer,
    Rejected,
}

private data class BadgeColors(val bg: Color, val text: Color)

private fun colorsFor(status: ApplicationStatus): BadgeColors = when (status) {
    ApplicationStatus.Saved -> BadgeColors(bg = Color(0xFFF3F4F6), text = TextSecondary)
    ApplicationStatus.Applied -> BadgeColors(bg = PurpleTint, text = BrandPurple)
    ApplicationStatus.Interview -> BadgeColors(bg = WarningAmberBg, text = WarningAmber)
    ApplicationStatus.Offer -> BadgeColors(bg = SuccessGreenBg, text = SuccessGreen)
    ApplicationStatus.Rejected -> BadgeColors(bg = ErrorRedBg, text = ErrorRed)
}

@Composable
fun StatusBadge(status: ApplicationStatus, modifier: Modifier = Modifier) {
    val (bg, text) = colorsFor(status)
    Box(
        modifier = modifier
            .background(color = bg, shape = RoundedCornerShape(4.dp))
            .padding(horizontal = 8.dp, vertical = 2.dp),
    ) {
        Text(
            text = status.name,
            color = text,
            style = MaterialTheme.typography.labelSmall,
        )
    }
}
