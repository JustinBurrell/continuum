package com.continuum.android.feature.notes.presentation

import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.BuildConfig
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

// ============================================================
// GoogleDriveImportScreen
// Purpose: Let the user select a Google Doc via the Google Picker.
// Flow:
//   1. Tap "Choose from Google Drive" → Chrome Custom Tab opens the backend Picker page
//   2. Backend serves /api/google/picker-page-cct with the Picker pre-loaded
//   3. User selects a Google Doc → Picker redirects to continuum://drive-pick?id=...
//   4. Android deep link routes to DrivePickResultScreen, import starts,
//      on success navigate to the new note
//
// Why Chrome Custom Tab (not WebView):
//   The Google Picker requires the user's Google account session via browser cookies.
//   A fresh WebView has no Google cookies, causing "Can't access your Google account".
//   Chrome Custom Tabs share Chrome's existing Google session, so the Picker works.
// ============================================================

@Composable
fun GoogleDriveImportScreen(
    onNavigateBack: () -> Unit,
    onImportSuccess: (noteId: String) -> Unit,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val driveState by viewModel.driveState.collectAsStateWithLifecycle()
    val isDemo = LocalIsDemo.current
    val context = LocalContext.current

    // Navigate away as soon as the import finishes (handles the case where
    // importFromDrive is called directly on this screen, e.g. in future flows)
    LaunchedEffect(driveState.importedNoteId) {
        driveState.importedNoteId?.let {
            viewModel.clearImportedNoteId()
            onImportSuccess(it)
        }
    }

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
                    onClick = {
                        if (!isDemo) {
                            val token = viewModel.getJwtToken() ?: return@ContinuumButton
                            val url = "${BuildConfig.BASE_URL}google/picker-page-cct?token=$token"
                            CustomTabsIntent.Builder()
                                .build()
                                .launchUrl(context, Uri.parse(url))
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isDemo
                )
            }

            Spacer(Modifier.height(8.dp))
        }
    }
}

// ============================================================
// DrivePickResultScreen
// Purpose: Receives the Google Drive file data from the continuum://drive-pick
//          deep link, triggers the import, and navigates on completion.
//          This composable is the destination in AppNavHost for the deep link.
// ============================================================
@Composable
internal fun DrivePickResultScreen(
    pickedId: String,
    pickedName: String,
    pickedUrl: String,
    onImportSuccess: (noteId: String) -> Unit,
    onImportFailed: () -> Unit,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val driveState by viewModel.driveState.collectAsStateWithLifecycle()

    // Trigger import once on first composition
    LaunchedEffect(pickedId) {
        if (pickedId.isNotBlank()) {
            viewModel.importFromDrive(
                googleDocId = pickedId,
                googleDocUrl = pickedUrl.ifBlank {
                    "https://docs.google.com/document/d/$pickedId/edit"
                },
                title = pickedName
            )
        } else {
            onImportFailed()
        }
    }

    // Navigate to note detail on success
    LaunchedEffect(driveState.importedNoteId) {
        driveState.importedNoteId?.let {
            viewModel.clearImportedNoteId()
            onImportSuccess(it)
        }
    }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        when {
            driveState.error != null -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.padding(24.dp)
                ) {
                    Text(
                        driveState.error ?: "",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.error
                    )
                    ContinuumButton(
                        text = "Go Back",
                        onClick = onImportFailed,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
            else -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    CircularProgressIndicator(color = BrandPurple)
                    Text(
                        "Importing…",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted
                    )
                }
            }
        }
    }
}
