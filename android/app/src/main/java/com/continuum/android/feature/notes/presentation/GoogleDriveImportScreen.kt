package com.continuum.android.feature.notes.presentation

import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.BuildConfig
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

// ============================================================
// GoogleDriveImportScreen
// Purpose: Let the user import a Google Doc via the Google Picker (primary)
//          or by pasting a doc URL (fallback).
//
// Primary flow — Google Picker via Chrome Custom Tab (CCT):
//   1. Tap "Choose from Google Drive"
//   2. CCT opens /api/google/picker-page-cct
//   3. Backend uses GIS initTokenClient with hint=userEmail so the Picker
//      authenticates for the specific Google account linked in Continuum —
//      not whichever account Chrome happens to be signed into.
//      GIS either proceeds silently (account already in Chrome) or shows
//      a targeted sign-in dialog for exactly that email.
//   4. User selects a Google Doc → page redirects to continuum://drive-pick
//   5. Deep link routes to DrivePickResultScreen → import starts
//
// Fallback flow — paste a Google Doc link:
//   Works on any device or emulator (HTTP) where GIS cannot run.
//   The import uses the account linked in Continuum regardless of Chrome state.
//
// Requirement for the Picker to work in production:
//   The backend HTTPS URL must be registered as an Authorized JavaScript
//   origin in Google Cloud Console (APIs & Services → OAuth 2.0 Client ID).
//   GIS does not work from HTTP origins (emulator) — use the URL input then.
// ============================================================

private val GOOGLE_DOC_ID_REGEX = Regex(
    """docs\.google\.com/document/d/([a-zA-Z0-9_-]+)"""
)

internal fun extractGoogleDocId(url: String): String? =
    GOOGLE_DOC_ID_REGEX.find(url)?.groupValues?.get(1)

@Composable
fun GoogleDriveImportScreen(
    onNavigateBack: () -> Unit,
    onImportSuccess: (noteId: String) -> Unit,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val driveState by viewModel.driveState.collectAsStateWithLifecycle()
    val isDemo = LocalIsDemo.current
    val context = LocalContext.current

    var docUrl by remember { mutableStateOf("") }
    var noteTitle by remember { mutableStateOf("") }

    val docId = extractGoogleDocId(docUrl)
    val isValidUrl = docId != null

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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                "Import a Google Doc as a note. Continuum only accesses files you choose.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )

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
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        CircularProgressIndicator(color = BrandPurple)
                        Text(
                            "Importing…",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextMuted
                        )
                    }
                }
            } else {
                // Primary: Google Picker via CCT + GIS (production / HTTPS)
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

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f))
                    Text("or paste a link", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                    HorizontalDivider(modifier = Modifier.weight(1f))
                }

                // Fallback: paste a Google Doc URL directly
                OutlinedTextField(
                    value = docUrl,
                    onValueChange = { docUrl = it },
                    label = { Text("Google Doc link") },
                    placeholder = { Text("https://docs.google.com/document/d/…") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Uri,
                        imeAction = ImeAction.Next
                    ),
                    isError = docUrl.isNotBlank() && !isValidUrl,
                    supportingText = if (docUrl.isNotBlank() && !isValidUrl) {
                        { Text("Paste the full Google Doc link") }
                    } else null
                )

                OutlinedTextField(
                    value = noteTitle,
                    onValueChange = { noteTitle = it },
                    label = { Text("Note title (optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done)
                )

                ContinuumButton(
                    text = "Import",
                    onClick = {
                        if (!isDemo && docId != null) {
                            viewModel.importFromDrive(
                                googleDocId = docId,
                                googleDocUrl = "https://docs.google.com/document/d/$docId/edit",
                                title = noteTitle.trim()
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isDemo && isValidUrl && !driveState.isImporting
                )
            }

            Spacer(Modifier.height(8.dp))
        }
    }
}

// ============================================================
// DrivePickResultScreen
// Purpose: Receives the Google Drive file data from the continuum://drive-pick
//          deep link (sent by the CCT Picker page on file selection), triggers
//          the import, and navigates on completion.
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
