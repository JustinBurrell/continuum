package com.continuum.android.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.theme.BrandPurple

private val DemoBannerBg = Color(0xFFF5F0FF)
private val DemoBannerBorder = Color(0xFFEDE9FE)
private val DemoBannerText = Color(0xFF4B2D6E)

@Composable
fun DemoBanner(
    modifier: Modifier = Modifier,
    onWantFullExperience: (() -> Unit)? = null
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(DemoBannerBg)
            .border(width = 1.dp, color = DemoBannerBorder),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .width(4.dp)
                .fillMaxHeight()
                .background(BrandPurple)
        )
        Row(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "You're exploring Continuum as a demo account. Content is read-only and changes won't be saved.",
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold,
                color = DemoBannerText,
                modifier = Modifier.weight(1f)
            )
            if (onWantFullExperience != null) {
                TextButton(onClick = onWantFullExperience) {
                    Text(
                        text = "Want the full experience? Register for free →",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Bold,
                        color = BrandPurple
                    )
                }
            }
        }
    }
}
