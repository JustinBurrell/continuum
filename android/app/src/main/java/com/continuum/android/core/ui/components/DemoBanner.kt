package com.continuum.android.core.ui.components

import androidx.compose.foundation.background
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

private val DemoBannerBg = Color(0xFFEDE9FE)
private val DemoBannerText = Color(0xFF4B2D6E)

@Composable
fun DemoBanner(
    modifier: Modifier = Modifier,
    onWantFullExperience: (() -> Unit)? = null
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(40.dp)
            .background(DemoBannerBg)
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = "Demo account — read-only",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.SemiBold,
            color = DemoBannerText,
            modifier = Modifier.weight(1f)
        )
        if (onWantFullExperience != null) {
            TextButton(
                onClick = onWantFullExperience,
                contentPadding = PaddingValues(horizontal = 4.dp)
            ) {
                Text(
                    text = "Sign up",
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.Bold,
                    color = BrandPurple
                )
            }
        }
    }
}
