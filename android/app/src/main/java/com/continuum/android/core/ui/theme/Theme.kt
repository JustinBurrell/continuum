package com.continuum.android.core.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = BrandPurple,
    onPrimary = White,
    primaryContainer = PurpleTint,
    onPrimaryContainer = DeepPurple,
    background = PageBackground,
    onBackground = TextPrimary,
    surface = White,
    onSurface = TextPrimary,
    surfaceVariant = PageBackground,
    onSurfaceVariant = TextSecondary,
    outline = Border,
    error = ErrorRed,
    onError = White,
)

@Composable
fun ContinuumTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = ContinuumTypography,
        content = content
    )
}
