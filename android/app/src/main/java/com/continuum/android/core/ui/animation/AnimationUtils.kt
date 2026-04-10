package com.continuum.android.core.ui.animation

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.keyframes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer

/**
 * A modifier that shakes horizontally when [trigger] changes to a new non-zero value.
 * Used for form validation error feedback.
 */
@Composable
fun Modifier.shakeOnError(trigger: Int): Modifier {
    val offsetX = remember { Animatable(0f) }
    LaunchedEffect(trigger) {
        if (trigger > 0) {
            offsetX.animateTo(
                targetValue = 0f,
                animationSpec = keyframes {
                    durationMillis = 400
                    0f at 0
                    -12f at 50
                    12f at 100
                    -8f at 150
                    8f at 200
                    -4f at 250
                    4f at 300
                    0f at 400
                }
            )
        }
    }
    return this.graphicsLayer { translationX = offsetX.value }
}
