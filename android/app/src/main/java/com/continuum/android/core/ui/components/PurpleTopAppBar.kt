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
import androidx.compose.ui.text.font.FontWeight
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.FrauncesFamily
import com.continuum.android.core.ui.theme.White

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PurpleTopAppBar(
    title: String,
    modifier: Modifier = Modifier,
    onNavigateBack: (() -> Unit)? = null,
    actions: @Composable () -> Unit = {},
) {
    TopAppBar(
        title = {
            Text(
                text = title,
                fontFamily = FrauncesFamily,
                fontWeight = FontWeight.Bold,
                color = White,
            )
        },
        navigationIcon = if (onNavigateBack != null) {
            {
                IconButton(onClick = onNavigateBack) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Back",
                        tint = White,
                    )
                }
            }
        } else {
            {}
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
