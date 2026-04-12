package com.continuum.android.core.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.theme.TextPrimary
import com.continuum.android.core.ui.theme.White

/**
 * Minimal top bar for detail/sub screens.
 * White background, dark text, simple back arrow.
 * Replaces the old purple bars on non-root screens.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MinimalTopBar(
    title: String = "",
    onNavigateBack: (() -> Unit)? = null,
    onTitleClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier,
    actions: @Composable () -> Unit = {},
) {
    TopAppBar(
        title = {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                modifier = Modifier.then(
                    if (onTitleClick != null) {
                        Modifier.clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null,
                            onClick = onTitleClick
                        )
                    } else {
                        Modifier
                    }
                )
            )
        },
        navigationIcon = {
            if (onNavigateBack != null) {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = TextPrimary,
                    )
                }
            }
        },
        actions = { actions() },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = White,
            titleContentColor = TextPrimary,
            navigationIconContentColor = TextPrimary,
            actionIconContentColor = TextPrimary,
        ),
        windowInsets = WindowInsets(0, 0, 0, 0),
        modifier = modifier,
    )
}
