package com.continuum.android.feature.notes.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.notes.domain.DriveFile

@Composable
fun GoogleDriveImportScreen(
    onNavigateBack: () -> Unit,
    onImportSuccess: (noteId: String) -> Unit,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val driveState by viewModel.driveState.collectAsStateWithLifecycle()
    var searchQuery by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { viewModel.loadDriveFiles() }

    LaunchedEffect(driveState.importedNoteId) {
        driveState.importedNoteId?.let {
            viewModel.clearImportedNoteId()
            onImportSuccess(it)
        }
    }

    val filtered = if (searchQuery.isBlank()) driveState.files
    else driveState.files.filter { it.name.contains(searchQuery, ignoreCase = true) }

    Scaffold(
        topBar = {
            PurpleTopAppBar(
                title = "Import from Drive",
                onNavigateBack = onNavigateBack
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search Drive files...") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(8.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BrandPurple,
                    unfocusedBorderColor = Border
                ),
                leadingIcon = { Icon(Icons.Default.Search, null, tint = TextSecondary) }
            )

            when {
                driveState.isLoading -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(6) {
                            SkeletonLoader(modifier = Modifier.fillMaxWidth().height(64.dp))
                        }
                    }
                }

                driveState.error != null -> {
                    if (driveState.error?.contains("linked") == true || driveState.error?.contains("google") == true) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(16.dp),
                                modifier = Modifier.padding(32.dp)
                            ) {
                                Icon(Icons.Default.LinkOff, null, tint = TextMuted, modifier = Modifier.size(48.dp))
                                Text("Google account not linked", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                                Text("Link your Google account to import from Drive.", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                                ContinuumButton(
                                    text = "Link Google Account",
                                    onClick = { /* trigger AuthorizationClient */ },
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    } else {
                        EmptyState(
                            icon = Icons.Default.ErrorOutline,
                            headline = "Failed to load files",
                            subtext = driveState.error ?: "",
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }

                filtered.isEmpty() -> {
                    EmptyState(
                        icon = Icons.Default.FolderOff,
                        headline = "No files found",
                        subtext = if (searchQuery.isBlank()) "No Google Docs in your Drive" else "No files match \"$searchQuery\"",
                        modifier = Modifier.fillMaxSize()
                    )
                }

                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(filtered, key = { it.id }) { file ->
                            DriveFileItem(
                                file = file,
                                isImporting = driveState.isImporting,
                                onClick = { viewModel.importFromDrive(file.id, file.name) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DriveFileItem(
    file: DriveFile,
    isImporting: Boolean,
    onClick: () -> Unit
) {
    ContinuumCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = !isImporting, onClick = onClick)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Icon(Icons.Default.Description, null, tint = BrandPurple, modifier = Modifier.size(32.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(file.name, style = MaterialTheme.typography.headlineSmall, color = TextPrimary, maxLines = 1)
                Text(file.modifiedTime, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
            if (isImporting) {
                CircularProgressIndicator(color = BrandPurple, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Icon(Icons.Default.Download, "Import", tint = TextSecondary)
            }
        }
    }
}
