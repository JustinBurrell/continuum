package com.continuum.android.core.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.theme.AppShape
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.WarningAmber

/**
 * Inline badges for public [roles] from the API (founder, team). Other values are ignored.
 */
@Composable
fun VerifiedRoleBadges(
    roles: List<String>,
    expanded: Boolean = true,
    modifier: Modifier = Modifier
) {
    if (roles.isEmpty()) return
    val showFounder = roles.any { it.equals("founder", ignoreCase = true) }
    val showTeam = roles.any { it.equals("team", ignoreCase = true) }
    if (!showFounder && !showTeam) return

    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (showFounder) {
            Surface(color = WarningAmber.copy(alpha = 0.15f), shape = AppShape.chip) {
                Row(
                    Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(16.dp))
                    if (expanded) {
                        Text("Founder", style = MaterialTheme.typography.labelMedium, color = WarningAmber)
                    }
                }
            }
        }
        if (showTeam) {
            Surface(color = BrandPurple.copy(alpha = 0.12f), shape = AppShape.chip) {
                Row(
                    Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    if (expanded) {
                        Text("Team Continuum", style = MaterialTheme.typography.labelMedium, color = BrandPurple)
                    }
                }
            }
        }
    }
}
