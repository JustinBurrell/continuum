package com.continuum.android.core.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.theme.AppShape
import com.continuum.android.core.ui.theme.Border
import com.continuum.android.core.ui.theme.White

enum class CardStyle {
    Flat,
    Elevated,
}

@Composable
fun ContinuumCard(
    modifier: Modifier = Modifier,
    style: CardStyle = CardStyle.Flat,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = AppShape.card
    val colors = CardDefaults.cardColors(containerColor = White)
    val elevation: CardDefaults = CardDefaults
    val cardElevation = when (style) {
        CardStyle.Flat -> CardDefaults.cardElevation(defaultElevation = 0.dp)
        CardStyle.Elevated -> CardDefaults.cardElevation(defaultElevation = 2.dp)
    }
    val border: BorderStroke? = when (style) {
        CardStyle.Flat -> BorderStroke(1.dp, Border)
        CardStyle.Elevated -> null
    }

    if (onClick != null) {
        Card(
            onClick = onClick,
            modifier = modifier,
            shape = shape,
            colors = colors,
            elevation = cardElevation,
            border = border,
            content = content,
        )
    } else {
        Card(
            modifier = modifier,
            shape = shape,
            colors = colors,
            elevation = cardElevation,
            border = border,
            content = content,
        )
    }
}
