package com.continuum.android.feature.notes.presentation

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.notes.domain.Note
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import androidx.hilt.navigation.compose.hiltViewModel as hilt

@Composable
fun NotesListScreen(
    onNoteClick: (String) -> Unit,
    onCreateNote: () -> Unit,
    onDriveImport: () -> Unit,
    networkMonitor: NetworkMonitor,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val listState by viewModel.listState.collectAsStateWithLifecycle()
    val filteredNotes by viewModel.filteredNotes.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)

    var showSearch by remember { mutableStateOf(false) }
    var noteToDelete by remember { mutableStateOf<Note?>(null) }
    var contextMenuNote by remember { mutableStateOf<Note?>(null) }

    LaunchedEffect(Unit) { viewModel.loadNotes() }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            if (!isOnline) OfflineBanner()

            PurpleTopAppBar(
                title = "Notes",
                actions = {
                    IconButton(onClick = { showSearch = !showSearch }) {
                        Icon(Icons.Default.Search, contentDescription = "Search", tint = androidx.compose.ui.graphics.Color.White)
                    }
                    IconButton(onClick = onDriveImport) {
                        Icon(Icons.Default.CloudDownload, contentDescription = "Import from Drive", tint = androidx.compose.ui.graphics.Color.White)
                    }
                }
            )

            if (showSearch) {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { viewModel.setSearchQuery(it) },
                    placeholder = { Text("Search notes...") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandPurple,
                        unfocusedBorderColor = Border
                    ),
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = TextSecondary) },
                    trailingIcon = {
                        if (searchQuery.isNotBlank()) {
                            IconButton(onClick = { viewModel.setSearchQuery("") }) {
                                Icon(Icons.Default.Close, null, tint = TextSecondary)
                            }
                        }
                    }
                )
            }

            SwipeRefresh(
                state = rememberSwipeRefreshState(listState.isLoading),
                onRefresh = { viewModel.loadNotes() },
                modifier = Modifier.weight(1f)
            ) {
                when {
                    listState.isLoading && listState.notes.isEmpty() -> {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(5) {
                                SkeletonLoader(
                                    modifier = Modifier.fillMaxWidth().height(90.dp),
                                    cornerRadius = 12f
                                )
                            }
                        }
                    }

                    filteredNotes.isEmpty() -> {
                        EmptyState(
                            icon = Icons.Default.Article,
                            headline = if (searchQuery.isBlank()) "No notes yet" else "No results",
                            subtext = if (searchQuery.isBlank()) "Tap + to create your first note" else "Try a different search term",
                            actionLabel = if (searchQuery.isBlank()) "Create note" else null,
                            onAction = if (searchQuery.isBlank()) onCreateNote else null,
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    else -> {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(filteredNotes, key = { it.id }) { note ->
                                NoteCard(
                                    note = note,
                                    onClick = { onNoteClick(note.id) },
                                    onLongClick = { contextMenuNote = note },
                                    onDelete = { noteToDelete = note }
                                )
                            }
                        }
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = onCreateNote,
            containerColor = BrandPurple,
            contentColor = White,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(16.dp)
        ) {
            Icon(Icons.Default.Add, contentDescription = "Create note")
        }
    }

    // Delete confirmation dialog
    noteToDelete?.let { note ->
        AlertDialog(
            onDismissRequest = { noteToDelete = null },
            title = { Text("Delete note?") },
            text = { Text("\"${note.title}\" will be permanently deleted.") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteNote(note.id)
                    noteToDelete = null
                }) {
                    Text("Delete", color = ErrorRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { noteToDelete = null }) { Text("Cancel") }
            }
        )
    }

    // Context menu
    contextMenuNote?.let { note ->
        AlertDialog(
            onDismissRequest = { contextMenuNote = null },
            title = { Text(note.title) },
            text = {
                Column {
                    listOf("Edit", "Delete", "Generate Flashcards").forEach { action ->
                        TextButton(
                            onClick = {
                                when (action) {
                                    "Edit" -> onNoteClick(note.id)
                                    "Delete" -> { noteToDelete = note }
                                    "Generate Flashcards" -> viewModel.generateFlashcards(note.id)
                                }
                                contextMenuNote = null
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(action, color = if (action == "Delete") ErrorRed else TextPrimary)
                        }
                    }
                }
            },
            confirmButton = {}
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun NoteCard(
    note: Note,
    onClick: () -> Unit,
    onLongClick: () -> Unit,
    onDelete: () -> Unit
) {
    val dismissState = rememberSwipeableState(initialValue = false)
    // Use SwipeToDismiss pattern via material3
    val swipeToDismissBoxState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            if (value == SwipeToDismissBoxValue.EndToStart) {
                onDelete()
                false // don't actually dismiss — wait for confirmation
            } else false
        }
    )

    SwipeToDismissBox(
        state = swipeToDismissBoxState,
        backgroundContent = {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(end = 16.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                Icon(Icons.Default.Delete, contentDescription = "Delete", tint = ErrorRed)
            }
        },
        enableDismissFromStartToEnd = false
    ) {
        ContinuumCard(
            modifier = Modifier
                .fillMaxWidth()
                .combinedClickable(onClick = onClick, onLongClick = onLongClick)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = note.title.ifBlank { "Untitled" },
                        style = MaterialTheme.typography.headlineSmall,
                        color = TextPrimary,
                        modifier = Modifier.weight(1f)
                    )
                    if (note.hasSummary) {
                        Surface(
                            color = PurpleTint,
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                "AI",
                                style = MaterialTheme.typography.labelSmall,
                                color = BrandPurple,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                if (note.preview.isNotBlank()) {
                    Text(
                        text = note.preview,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        maxLines = 2
                    )
                }

                if (note.tags.isNotEmpty()) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        note.tags.take(3).forEach { tag ->
                            Surface(color = PurpleTint, shape = RoundedCornerShape(4.dp)) {
                                Text(
                                    text = tag,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = BrandPurple,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun rememberSwipeableState(initialValue: Boolean) = remember { mutableStateOf(initialValue) }
