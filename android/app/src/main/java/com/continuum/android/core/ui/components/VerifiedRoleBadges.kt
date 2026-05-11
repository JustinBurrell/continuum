package com.continuum.android.core.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import coil3.compose.rememberAsyncImagePainter
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.WarningAmber

/**
 * Inline role icons for public [roles] from the API (founder, team).
 * When [expanded] = true, shows icon + text label (e.g. in expanded profile views on web).
 * When [expanded] = false (default everywhere on mobile), shows icon only — no chip, no background.
 */
@Composable
fun VerifiedRoleBadges(
    roles: List<String>,
    expanded: Boolean = false,
    modifier: Modifier = Modifier
) {
    if (roles.isEmpty()) return
    val showFounder = roles.any { it.equals("founder", ignoreCase = true) }
    val showTeam = roles.any { it.equals("team", ignoreCase = true) }
    if (!showFounder && !showTeam) return

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (showFounder) {
            Icon(
                imageVector = Icons.Default.Star,
                contentDescription = "Founder",
                tint = WarningAmber,
                modifier = Modifier.size(16.dp)
            )
            if (expanded) {
                Text("Founder", style = MaterialTheme.typography.labelMedium, color = WarningAmber)
            }
        }
        if (showTeam) {
            Icon(
                painter = rememberAsyncImagePainter("file:///android_asset/ic_logo_symbol.svg"),
                contentDescription = "Team Continuum",
                tint = BrandPurple,
                modifier = Modifier.size(16.dp)
            )
            if (expanded) {
                Text("Team Continuum", style = MaterialTheme.typography.labelMedium, color = BrandPurple)
            }
        }
    }
}
