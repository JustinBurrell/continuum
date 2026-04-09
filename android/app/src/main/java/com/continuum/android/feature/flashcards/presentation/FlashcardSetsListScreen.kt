@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.continuum.android.feature.flashcards.presentation

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
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.flashcards.domain.FlashcardSet
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import androidx.compose.material3.ExperimentalMaterial3Api

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlashcardSetsListScreen(
    onSetClick: (String) -> Unit,
    onStudy: (String) -> Unit,
    onLogoClick: (() -> Unit)? = null,
    viewModel: FlashcardsViewModel = hiltViewModel()
) {
    val state by viewModel.setsState.collectAsStateWithLifecycle()
    var showCreateSheet by remember { mutableStateOf(false) }
    var showGenerateSheet by remember { mutableStateOf(false) }
    var setToDelete by remember { mutableStateOf<FlashcardSet?>(null) }

    LaunchedEffect(Unit) { viewModel.loadSets() }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            PurpleTopAppBar(title = "Flashcards", onLogoClick = onLogoClick)

            SwipeRefresh(
                state = rememberSwipeRefreshState(state.isLoading),
                onRefresh = { viewModel.loadSets() },
                modifier = Modifier.weight(1f)
            ) {
                when {
                    state.isLoading && state.sets.isEmpty() -> {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(4) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(80.dp)) }
                        }
                    }

                    state.sets.isEmpty() -> {
                        EmptyState(
                            icon = Icons.Default.Style,
                            headline = "No flashcard sets yet",
                            subtext = "Create a set or generate one from your notes",
                            actionLabel = "Create set",
                            onAction = { showCreateSheet = true },
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    else -> {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.sets, key = { it.id }) { set ->
                                FlashcardSetCard(
                                    set = set,
                                    onClick = { onSetClick(set.id) },
                                    onStudy = { onStudy(set.id) },
                                    onDelete = { setToDelete = set }
                                )
                            }
                        }
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { showCreateSheet = true },
            containerColor = BrandPurple,
            contentColor = White,
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp)
        ) {
            Icon(Icons.Default.Add, "Create set")
        }
    }

    setToDelete?.let { set ->
        AlertDialog(
            onDismissRequest = { setToDelete = null },
            title = { Text("Delete set?") },
            text = { Text("\"${set.title}\" and all its cards will be deleted.") },
            confirmButton = {
                TextButton(onClick = { viewModel.deleteSet(set.id); setToDelete = null }) {
                    Text("Delete", color = ErrorRed)
                }
            },
            dismissButton = { TextButton(onClick = { setToDelete = null }) { Text("Cancel") } }
        )
    }

    if (showCreateSheet) {
        CreateSetSheet(
            onDismiss = { showCreateSheet = false },
            onCreate = { title, desc ->
                viewModel.createSet(title, desc) { showCreateSheet = false }
            },
            onGenerateFromContent = { showCreateSheet = false; showGenerateSheet = true }
        )
    }

    if (showGenerateSheet) {
        GenerateSetSheet(
            onDismiss = { showGenerateSheet = false },
            onGenerate = { content, title ->
                viewModel.generateSet(content, title) { showGenerateSheet = false }
            }
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun FlashcardSetCard(
    set: FlashcardSet,
    onClick: () -> Unit,
    onStudy: () -> Unit,
    onDelete: () -> Unit
) {
    val swipeToDismissBoxState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            if (value == SwipeToDismissBoxValue.EndToStart) { onDelete(); false } else false
        }
    )

    SwipeToDismissBox(
        state = swipeToDismissBoxState,
        backgroundContent = {
            Box(Modifier.fillMaxSize().padding(end = 16.dp), contentAlignment = Alignment.CenterEnd) {
                Icon(Icons.Default.Delete, null, tint = ErrorRed)
            }
        },
        enableDismissFromStartToEnd = false
    ) {
        ContinuumCard(
            modifier = Modifier.fillMaxWidth().combinedClickable(onClick = onClick)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(set.title, style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                        if (set.description.isNotBlank()) {
                            Text(set.description, style = MaterialTheme.typography.bodySmall, color = TextSecondary, maxLines = 1)
                        }
                    }
                    if (set.isAIGenerated) {
                        Surface(color = PurpleTint, shape = RoundedCornerShape(4.dp)) {
                            Text("AI", style = MaterialTheme.typography.labelSmall, color = BrandPurple,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                        }
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "${set.cardCount} cards",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted
                    )
                    ContinuumButton(
                        text = "Study",
                        onClick = onStudy,
                        modifier = Modifier.height(36.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun CreateSetSheet(
    onDismiss: () -> Unit,
    onCreate: (title: String, description: String) -> Unit,
    onGenerateFromContent: () -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("Create flashcard set", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
            ContinuumTextField(value = title, onValueChange = { title = it }, label = "Title")
            ContinuumTextField(value = description, onValueChange = { description = it }, label = "Description (optional)", singleLine = false, maxLines = 3)
            ContinuumButton(
                text = "Create set",
                onClick = { if (title.isNotBlank()) onCreate(title, description) },
                modifier = Modifier.fillMaxWidth(),
                enabled = title.isNotBlank()
            )
            ContinuumButton(
                text = "Generate from content",
                onClick = onGenerateFromContent,
                modifier = Modifier.fillMaxWidth(),
                variant = ContinuumButtonVariant.Secondary
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun GenerateSetSheet(onDismiss: () -> Unit, onGenerate: (content: String, title: String) -> Unit) {
    var content by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("Generate from content", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
            ContinuumTextField(value = title, onValueChange = { title = it }, label = "Set title")
            ContinuumTextField(
                value = content,
                onValueChange = { content = it },
                label = "Paste content here",
                singleLine = false,
                maxLines = 8,
                modifier = Modifier.height(160.dp)
            )
            ContinuumButton(
                text = "Generate cards",
                onClick = { if (content.isNotBlank() && title.isNotBlank()) onGenerate(content, title) },
                modifier = Modifier.fillMaxWidth(),
                enabled = content.isNotBlank() && title.isNotBlank()
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}
