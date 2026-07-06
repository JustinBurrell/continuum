package com.continuum.android.core.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun IntegrationLogo(
    @DrawableRes iconRes: Int,
    size: Dp = 24.dp,
    modifier: Modifier = Modifier,
) {
    Icon(
        painter = painterResource(id = iconRes),
        contentDescription = null,
        modifier = modifier.size(size),
        tint = Color.Unspecified,
    )
}
