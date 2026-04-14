package com.continuum.android.feature.auth.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.continuum.android.R
import com.continuum.android.core.ui.components.MinimalTopBar
import com.continuum.android.core.ui.theme.TextPrimary

@Composable
fun LegalDocumentScreen(
    title: String,
    path: String,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val content = remember(path) {
        val resId = when {
            path.contains("privacy") -> R.raw.privacy_policy
            path.contains("terms") -> R.raw.terms_of_service
            else -> R.raw.privacy_policy
        }
        context.resources.openRawResource(resId).bufferedReader().use { it.readText() }
    }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = title,
                onNavigateBack = onNavigateBack
            )
        }
    ) { innerPadding ->
        Text(
            text = content,
            style = MaterialTheme.typography.bodyMedium,
            color = TextPrimary,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        )
    }
}
