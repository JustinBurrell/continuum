package com.continuum.android.feature.notes.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

// Regex to extract document ID from a Google Docs URL.
// Matches: https://docs.google.com/document/d/<ID>/...
private val DOCS_ID_REGEX = Regex("docs\\.google\\.com/document/d/([a-zA-Z0-9_-]+)")

@Composable
fun GoogleDriveImportScreen(
    onNavigateBack: () -> Unit,
    onImportSuccess: (noteId: String) -> Unit,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val driveState by viewModel.driveState.collectAsStateWithLifecycle()
    val isDemo = LocalIsDemo.current
    var docUrl by remember { mutableStateOf("") }
    var urlError by remember { mutableStateOf<String?>(null) }

    // Extract doc ID from URL whenever input changes
    val docId = remember(docUrl) {
        DOCS_ID_REGEX.find(docUrl)?.groupValues?.getOrNull(1)
    }
    val docUrl_normalized = remember(docId) {
        docId?.let { "https://docs.google.com/document/d/$it/edit" }
    }

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
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                "Continuum only accesses Google Docs you select.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )

            Text(
                "Open a Google Doc, tap the share icon, copy the link, and paste it below.",
                style = MaterialTheme.typography.bodySmall,
                color = TextMuted
            )

            OutlinedTextField(
                value = docUrl,
                onValueChange = {
                    docUrl = it
                    urlError = null
                },
                label = { Text("Google Docs URL") },
                placeholder = { Text("https://docs.google.com/document/d/…") },
                singleLine = false,
                maxLines = 3,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                isError = urlError != null,
                supportingText = if (urlError != null) {
                    { Text(urlError!!, color = MaterialTheme.colorScheme.error) }
                } else if (docId != null) {
                    { Text("Document ID: $docId", color = BrandPurple, style = MaterialTheme.typography.labelSmall) }
                } else null,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BrandPurple,
                    unfocusedBorderColor = Border
                )
            )

            // Google account not linked error
            if (driveState.error?.contains("linked", ignoreCase = true) == true ||
                driveState.error?.contains("google", ignoreCase = true) == true) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.LinkOff, null, tint = MaterialTheme.colorScheme.error, modifier = Modifier.size(20.dp))
                    Text(
                        "Google account not linked. Connect it from your profile.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            } else if (driveState.error != null) {
                Text(
                    driveState.error ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error
                )
            }

            Spacer(Modifier.weight(1f))

            ContinuumButton(
                text = if (driveState.isImporting) "Importing…" else "Import",
                onClick = {
                    if (docId == null) {
                        urlError = "Please enter a valid Google Docs URL."
                    } else if (!isDemo) {
                        viewModel.importFromDrive(
                            googleDocId = docId,
                            googleDocUrl = docUrl_normalized ?: docUrl,
                            title = ""
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                loading = driveState.isImporting,
                enabled = docUrl.isNotBlank() && !driveState.isImporting && !isDemo
            )
        }
    }
}
