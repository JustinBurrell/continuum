package com.continuum.android.feature.auth.presentation

import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.continuum.android.BuildConfig
import com.continuum.android.core.ui.components.MinimalTopBar

@Composable
fun LegalDocumentScreen(
    title: String,
    path: String,
    onNavigateBack: () -> Unit
) {
    val legalUrl = remember(path) {
        val appBase = BuildConfig.BASE_URL
            .substringBefore("/api/")
            .substringBefore("/api")
            .trimEnd('/')
        "$appBase/$path"
    }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = title,
                onNavigateBack = onNavigateBack
            )
        }
    ) { innerPadding ->
        AndroidView(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            factory = { context ->
                WebView(context).apply {
                    webViewClient = WebViewClient()
                    settings.javaScriptEnabled = false
                    loadUrl(legalUrl)
                }
            },
            update = { webView -> webView.loadUrl(legalUrl) }
        )
    }
}
