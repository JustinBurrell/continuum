@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.continuum.android.feature.flashcards.presentation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.continuum.android.feature.flashcards.domain.Flashcard
import androidx.compose.material3.ExperimentalMaterial3Api

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FlashcardSetDetailScreen(
    setId: String,
    onNavigateBack: () -> Unit,
    onStudy: () -> Unit,
    viewModel: FlashcardsViewModel = hiltViewModel()
) {
    val state by viewModel.detailState.collectAsStateWithLifecycle()
    var showAddSheet by remember { mutableStateOf(false) }
    var editingCard by remember { mutableStateOf<Flashcard?>(null) }
    var cardToDelete by remember { mutableStateOf<Flashcard?>(null) }

    LaunchedEffect(setId) { viewModel.loadSetDetail(setId) }

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
                PurpleTopAppBar(
                    title = state.set?.title ?: "",
                    onNavigateBack = onNavigateBack,
                    actions = {
                        TextButton(onClick = onStudy) {
                            Text("Study", color = androidx.compose.ui.graphics.Color.White)
                        }
                    }
                )
            }
        ) { innerPadding ->
            when {
                state.isLoading && state.cards.isEmpty() -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        items(5) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(70.dp)) }
                    }
                }

                state.cards.isEmpty() -> {
                    EmptyState(
                        icon = Icons.Default.Style,
                        headline = "No cards yet",
                        subtext = "Tap + to add your first card",
                        modifier = Modifier.fillMaxSize().padding(innerPadding)
                    )
                }

                else -> {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        items(state.cards, key = { it.id }) { card ->
                            CardItem(
                                card = card,
                                onEdit = { editingCard = card },
                                onDelete = { cardToDelete = card }
                            )
                        }
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { showAddSheet = true },
            containerColor = BrandPurple,
            contentColor = White,
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp)
        ) {
            Icon(Icons.Default.Add, "Add card")
        }
    }

    cardToDelete?.let { card ->
        AlertDialog(
            onDismissRequest = { cardToDelete = null },
            title = { Text("Delete card?") },
            text = { Text("\"${card.front}\" will be deleted.") },
            confirmButton = {
                TextButton(onClick = { viewModel.deleteCard(setId, card.id); cardToDelete = null }) {
                    Text("Delete", color = ErrorRed)
                }
            },
            dismissButton = { TextButton(onClick = { cardToDelete = null }) { Text("Cancel") } }
        )
    }

    if (showAddSheet) {
        CardEditSheet(
            title = "Add card",
            initialFront = "",
            initialBack = "",
            onDismiss = { showAddSheet = false },
            onSave = { front, back -> viewModel.addCard(setId, front, back); showAddSheet = false }
        )
    }

    editingCard?.let { card ->
        CardEditSheet(
            title = "Edit card",
            initialFront = card.front,
            initialBack = card.back,
            onDismiss = { editingCard = null },
            onSave = { front, back -> viewModel.updateCard(setId, card.id, front, back); editingCard = null }
        )
    }
}

@Composable
private fun CardItem(
    card: Flashcard,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val swipeToDismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            if (value == SwipeToDismissBoxValue.StartToEnd) { onEdit(); false }
            else if (value == SwipeToDismissBoxValue.EndToStart) { onDelete(); false }
            else false
        }
    )

    SwipeToDismissBox(
        state = swipeToDismissState,
        backgroundContent = {
            Box(Modifier.fillMaxSize()) {
                if (swipeToDismissState.dismissDirection == SwipeToDismissBoxValue.StartToEnd) {
                    Box(Modifier.fillMaxSize().padding(start = 16.dp), contentAlignment = Alignment.CenterStart) {
                        Icon(Icons.Default.Edit, null, tint = BrandPurple)
                    }
                } else {
                    Box(Modifier.fillMaxSize().padding(end = 16.dp), contentAlignment = Alignment.CenterEnd) {
                        Icon(Icons.Default.Delete, null, tint = ErrorRed)
                    }
                }
            }
        }
    ) {
        ContinuumCard(
            modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded }
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(card.front, style = MaterialTheme.typography.bodyMedium, color = TextPrimary, modifier = Modifier.weight(1f))
                    Icon(
                        if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        null,
                        tint = TextMuted
                    )
                }
                AnimatedVisibility(visible = expanded) {
                    Column {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Border)
                        Text(card.back, style = MaterialTheme.typography.bodyMedium, color = BrandPurple)
                    }
                }
            }
        }
    }
}

@Composable
private fun CardEditSheet(
    title: String,
    initialFront: String,
    initialBack: String,
    onDismiss: () -> Unit,
    onSave: (front: String, back: String) -> Unit
) {
    var front by remember { mutableStateOf(initialFront) }
    var back by remember { mutableStateOf(initialBack) }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp).imePadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(title, style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
            ContinuumTextField(value = front, onValueChange = { front = it }, label = "Front (question)", singleLine = false, maxLines = 3)
            ContinuumTextField(value = back, onValueChange = { back = it }, label = "Back (answer)", singleLine = false, maxLines = 3)
            ContinuumButton(
                text = "Save",
                onClick = { if (front.isNotBlank() && back.isNotBlank()) onSave(front, back) },
                modifier = Modifier.fillMaxWidth(),
                enabled = front.isNotBlank() && back.isNotBlank()
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}
