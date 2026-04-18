package com.continuum.android.feature.notes.presentation

import android.annotation.SuppressLint
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.BuildConfig
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

// ============================================================
// GoogleDriveImportScreen
// Purpose: Let the user select a Google Doc via an embedded Google Picker WebView
// Flow:
//   1. Tap "Choose from Google Drive" → full-screen WebView opens
//   2. Backend serves /api/google/picker-page with the Picker pre-loaded
//   3. User selects a Google Doc → JS bridge calls AndroidPicker.onFilePicked
//   4. WebView closes, import starts, on success navigate to the new note
// ============================================================

@Composable
fun GoogleDriveImportScreen(
    onNavigateBack: () -> Unit,
    onImportSuccess: (noteId: String) -> Unit,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val driveState by viewModel.driveState.collectAsStateWithLifecycle()
    val isDemo = LocalIsDemo.current
    var showPicker by remember { mutableStateOf(false) }

    // Navigate away as soon as the import finishes
    LaunchedEffect(driveState.importedNoteId) {
        driveState.importedNoteId?.let {
            viewModel.clearImportedNoteId()
            onImportSuccess(it)
        }
    }

    if (showPicker) {
        // Back press while picker is open → dismiss the picker, stay on screen
        BackHandler { showPicker = false }

        GooglePickerWebView(
            pickerUrl = "${BuildConfig.BASE_URL}google/picker-page",
            jwtToken = viewModel.getJwtToken() ?: "",
            onFilePicked = { docId, docName, docUrl ->
                showPicker = false
                if (!isDemo) {
                    viewModel.importFromDrive(
                        googleDocId = docId,
                        googleDocUrl = docUrl,
                        title = docName
                    )
                }
            },
            onCancelled = { showPicker = false }
        )
    } else {
        Scaffold(
            topBar = {
                MinimalTopBar(
                    title = "Import from Drive",
                    onNavigateBack = onNavigateBack
                )
            }
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Select a Google Doc to import as a note. Continuum only accesses files you choose.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )

                // Error banner
                if (driveState.error != null) {
                    Surface(
                        shape = MaterialTheme.shapes.small,
                        color = MaterialTheme.colorScheme.errorContainer,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            driveState.error ?: "",
                            modifier = Modifier.padding(12.dp),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }

                Spacer(Modifier.weight(1f))

                if (driveState.isImporting) {
                    CircularProgressIndicator(color = BrandPurple)
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "Importing…",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted
                    )
                } else {
                    ContinuumButton(
                        text = "Choose from Google Drive",
                        onClick = { if (!isDemo) showPicker = true },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !isDemo
                    )
                }

                Spacer(Modifier.height(8.dp))
            }
        }
    }
}

// ============================================================
// GooglePickerWebView
// Purpose: Full-screen WebView that loads the backend-served Picker page
// The backend endpoint (/api/google/picker-page) embeds the user's Google
// access token into the HTML so the Picker can open without additional auth.
// The JS bridge ("AndroidPicker") receives the selected file's id/name/url.
//
// Note: GOOGLE_PICKER_API_KEY in backend/.env must allow the backend domain
// as an HTTP referrer (dev: http://10.0.2.2:5001/*, prod: backend domain).
// ============================================================
@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun GooglePickerWebView(
    pickerUrl: String,
    jwtToken: String,
    onFilePicked: (id: String, name: String, url: String) -> Unit,
    onCancelled: () -> Unit
) {
    val mainHandler = remember { Handler(Looper.getMainLooper()) }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                WebView(context).apply {
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        // The dev backend is HTTP; Google scripts are HTTPS.
                        // Allow loading HTTPS content from an HTTP origin in dev.
                        @Suppress("DEPRECATION")
                        mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    }

                    // Bridge called by the Picker HTML when the user selects a file or cancels
                    addJavascriptInterface(object : Any() {
                        @JavascriptInterface
                        fun onFilePicked(id: String, name: String, url: String) {
                            mainHandler.post { onFilePicked(id, name, url) }
                        }

                        @JavascriptInterface
                        fun onPickerCancelled() {
                            mainHandler.post { onCancelled() }
                        }
                    }, "AndroidPicker")

                    webViewClient = object : WebViewClient() {
                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            // Only cancel on the main frame error (not sub-resource errors)
                            if (request?.isForMainFrame == true) {
                                mainHandler.post { onCancelled() }
                            }
                        }
                    }

                    // Required so that Picker dialogs (alerts, etc.) work correctly
                    webChromeClient = WebChromeClient()

                    // Load with JWT in the Authorization header — the backend auth middleware
                    // validates this, then embeds the Google access token into the returned HTML
                    loadUrl(pickerUrl, mapOf("Authorization" to "Bearer $jwtToken"))
                }
            }
        )
    }
}
