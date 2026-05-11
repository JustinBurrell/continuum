package com.continuum.android.core.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import coil3.compose.rememberAsyncImagePainter
import com.continuum.android.core.ui.theme.BrandPurple

/**
 * Shows the Team Continuum icon for users with the "team" role.
 * The "founder" role is intentionally not rendered — team membership covers it.
 */
@Composable
fun VerifiedRoleBadges(
    roles: List<String>,
    expanded: Boolean = false,
    modifier: Modifier = Modifier
) {
    if (roles.none { it.equals("team", ignoreCase = true) }) return

    Icon(
        painter = rememberAsyncImagePainter("file:///android_asset/ic_logo_symbol.svg"),
        contentDescription = "Team Continuum",
        tint = BrandPurple,
        modifier = modifier.size(16.dp)
    )
}
