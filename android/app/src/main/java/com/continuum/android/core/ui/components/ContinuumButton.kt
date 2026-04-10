package com.continuum.android.core.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.theme.AppShape
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.ErrorRed
import com.continuum.android.core.ui.theme.White

enum class ContinuumButtonVariant { Primary, Secondary, Danger }

@Composable
fun ContinuumButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ContinuumButtonVariant = ContinuumButtonVariant.Primary,
    enabled: Boolean = true,
    loading: Boolean = false,
) {
    val shape = AppShape.button

    when (variant) {
        ContinuumButtonVariant.Secondary -> {
            OutlinedButton(
                onClick = onClick,
                modifier = modifier.height(48.dp),
                enabled = enabled && !loading,
                shape = shape,
                border = BorderStroke(1.dp, BrandPurple),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = BrandPurple,
                ),
            ) {
                if (loading) {
                    CircularProgressIndicator(color = BrandPurple, strokeWidth = 2.dp)
                } else {
                    Text(text)
                }
            }
        }

        else -> {
            val containerColor = if (variant == ContinuumButtonVariant.Danger) ErrorRed else BrandPurple
            Button(
                onClick = onClick,
                modifier = modifier.height(48.dp),
                enabled = enabled && !loading,
                shape = shape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = containerColor,
                    contentColor = White,
                ),
            ) {
                if (loading) {
                    CircularProgressIndicator(color = White, strokeWidth = 2.dp)
                } else {
                    Text(text)
                }
            }
        }
    }
}
