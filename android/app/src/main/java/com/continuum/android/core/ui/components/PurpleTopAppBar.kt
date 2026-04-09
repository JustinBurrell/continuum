package com.continuum.android.core.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import com.continuum.android.R
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.FrauncesFamily
import com.continuum.android.core.ui.theme.White

/**
 * Branded top app bar used on every screen.
 *
 * Navigation icon logic:
 *   - [onNavigateBack] != null  → back arrow (detail/sub screens)
 *   - [onNavigateBack] == null  → logo symbol (ic_logo_symbol); tappable if [onLogoClick] != null
 *
 * Title logic:
 *   - [titleContent] != null    → custom composable (e.g. wordmark image on Dashboard)
 *   - otherwise                 → [title] string in Fraunces Bold
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PurpleTopAppBar(
    title: String = "",
    titleContent: (@Composable () -> Unit)? = null,
    modifier: Modifier = Modifier,
    onNavigateBack: (() -> Unit)? = null,
    onLogoClick: (() -> Unit)? = null,
    actions: @Composable () -> Unit = {},
) {
    TopAppBar(
        title = {
            if (titleContent != null) {
                titleContent()
            } else {
                Text(
                    text = title,
                    fontFamily = FrauncesFamily,
                    fontWeight = FontWeight.Bold,
                    color = White,
                )
            }
        },
        navigationIcon = {
            when {
                onNavigateBack != null -> {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = White,
                        )
                    }
                }
                onLogoClick != null -> {
                    IconButton(onClick = onLogoClick) {
                        Icon(
                            painter = painterResource(R.drawable.ic_logo_symbol),
                            contentDescription = "Home",
                            tint = White,
                        )
                    }
                }
                else -> {
                    IconButton(onClick = {}) {
                        Icon(
                            painter = painterResource(R.drawable.ic_logo_symbol),
                            contentDescription = "Continuum",
                            tint = White,
                        )
                    }
                }
            }
        },
        actions = { actions() },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = BrandPurple,
            titleContentColor = White,
            navigationIconContentColor = White,
            actionIconContentColor = White,
        ),
        modifier = modifier,
    )
}
