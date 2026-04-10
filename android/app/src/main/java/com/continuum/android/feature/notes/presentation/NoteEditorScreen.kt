package com.continuum.android.feature.notes.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.FormatListBulleted
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.mohamedrejeb.richeditor.model.rememberRichTextState
import com.mohamedrejeb.richeditor.ui.material3.RichTextEditor
import androidx.compose.material3.ExperimentalMaterial3Api

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteEditorScreen(
    noteId: String,  // "new" for create mode
    onNavigateBack: () -> Unit,
    networkMonitor: NetworkMonitor,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val isCreating = noteId == "new"
    val detailState by viewModel.detailState.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)

    var title by remember { mutableStateOf("") }
    var tagInput by remember { mutableStateOf("") }
    var tags by remember { mutableStateOf(listOf<String>()) }
    var visibility by remember { mutableStateOf("private") }
    var showVisibilitySheet by remember { mutableStateOf(false) }

    val richTextState = rememberRichTextState()

    LaunchedEffect(noteId) {
        if (!isCreating) {
            viewModel.loadNote(noteId)
        }
    }

    LaunchedEffect(detailState.note) {
        detailState.note?.let { note ->
            if (title.isBlank()) title = note.title
            if (tags.isEmpty()) tags = note.tags
            visibility = note.visibility
            if (richTextState.toHtml().isBlank()) richTextState.setHtml(note.content)
        }
    }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = if (isCreating) "New Note" else "Edit Note",
                onNavigateBack = onNavigateBack,
                actions = {
                    if (detailState.isSaving) {
                        CircularProgressIndicator(
                            color = BrandPurple,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(20.dp).padding(end = 12.dp)
                        )
                    } else {
                        IconButton(onClick = { showVisibilitySheet = true }) {
                            Icon(
                                when (visibility) {
                                    "friends" -> Icons.Default.People
                                    "specific" -> Icons.Default.PersonAdd
                                    else -> Icons.Default.Lock
                                },
                                "Visibility",
                                tint = TextPrimary
                            )
                        }
                    }
                    if (isCreating) {
                        TextButton(onClick = {
                            if (title.isNotBlank()) {
                                viewModel.createNote(title, richTextState.toHtml(), tags, visibility) { onNavigateBack() }
                            }
                        }) {
                            Text("Save", color = BrandPurple)
                        }
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .imePadding()
        ) {
            if (!isOnline) OfflineBanner()

            // Title
            OutlinedTextField(
                value = title,
                onValueChange = {
                    title = it
                    if (!isCreating && noteId != "new") {
                        viewModel.scheduleAutoSave(noteId, it, richTextState.toHtml(), tags, visibility)
                    }
                },
                placeholder = { Text("Note title", color = TextMuted) },
                singleLine = true,
                textStyle = MaterialTheme.typography.headlineMedium.copy(color = TextPrimary),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedBorderColor = androidx.compose.ui.graphics.Color.Transparent,
                    focusedBorderColor = androidx.compose.ui.graphics.Color.Transparent
                )
            )

            // Tag input
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.weight(1f)) {
                    items(tags) { tag ->
                        InputChip(
                            selected = false,
                            onClick = { tags = tags - tag },
                            label = { Text(tag, style = MaterialTheme.typography.labelSmall) },
                            trailingIcon = { Icon(Icons.Default.Close, null, modifier = Modifier.size(14.dp)) },
                            colors = InputChipDefaults.inputChipColors(
                                containerColor = PurpleTint,
                                labelColor = BrandPurple
                            )
                        )
                    }
                }
                OutlinedTextField(
                    value = tagInput,
                    onValueChange = { tagInput = it },
                    placeholder = { Text("Add tag", color = TextMuted, style = MaterialTheme.typography.bodySmall) },
                    singleLine = true,
                    modifier = Modifier.width(100.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandPurple,
                        unfocusedBorderColor = Border
                    ),
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        imeAction = androidx.compose.ui.text.input.ImeAction.Done
                    ),
                    keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                        onDone = {
                            val trimmed = tagInput.trim()
                            if (trimmed.isNotBlank() && !tags.contains(trimmed)) {
                                tags = tags + trimmed
                            }
                            tagInput = ""
                        }
                    )
                )
            }

            HorizontalDivider(color = Border, modifier = Modifier.padding(vertical = 4.dp))

            // Formatting toolbar
            FormattingToolbar(
                richTextState = richTextState,
                onContentChange = {
                    if (!isCreating) {
                        viewModel.scheduleAutoSave(noteId, title, richTextState.toHtml(), tags, visibility)
                    }
                }
            )

            HorizontalDivider(color = Border)

            // Rich text editor
            RichTextEditor(
                state = richTextState,
                modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 8.dp),
                textStyle = MaterialTheme.typography.bodyLarge.copy(color = TextPrimary),
                placeholder = { Text("Start writing...", color = TextMuted) }
            )
        }
    }

    if (showVisibilitySheet) {
        ModalBottomSheet(onDismissRequest = { showVisibilitySheet = false }) {
            Column(modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)) {
                Text("Who can see this?", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                Spacer(Modifier.height(16.dp))
                listOf("private" to "Only me", "friends" to "My friends", "specific" to "Specific people").forEach { (value, label) ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = visibility == value,
                            onClick = {
                                visibility = value
                                showVisibilitySheet = false
                                if (!isCreating) {
                                    viewModel.scheduleAutoSave(noteId, title, richTextState.toHtml(), tags, value)
                                }
                            },
                            colors = RadioButtonDefaults.colors(selectedColor = BrandPurple)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(label, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                    }
                }
                Spacer(Modifier.height(32.dp))
            }
        }
    }
}

@Composable
private fun FormattingToolbar(
    richTextState: com.mohamedrejeb.richeditor.model.RichTextState,
    onContentChange: () -> Unit
) {
    LazyRow(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        item {
            FormatButton(
                icon = Icons.Default.FormatBold,
                active = richTextState.currentSpanStyle.fontWeight == FontWeight.Bold,
                onClick = { richTextState.toggleSpanStyle(richTextState.currentSpanStyle.copy(fontWeight = if (richTextState.currentSpanStyle.fontWeight == FontWeight.Bold) FontWeight.Normal else FontWeight.Bold)); onContentChange() }
            )
        }
        item {
            FormatButton(
                icon = Icons.Default.FormatItalic,
                active = richTextState.currentSpanStyle.fontStyle == FontStyle.Italic,
                onClick = { richTextState.toggleSpanStyle(richTextState.currentSpanStyle.copy(fontStyle = if (richTextState.currentSpanStyle.fontStyle == FontStyle.Italic) FontStyle.Normal else FontStyle.Italic)); onContentChange() }
            )
        }
        item {
            FormatButton(
                icon = Icons.Default.FormatUnderlined,
                active = richTextState.currentSpanStyle.textDecoration?.contains(androidx.compose.ui.text.style.TextDecoration.Underline) == true,
                onClick = { richTextState.toggleSpanStyle(richTextState.currentSpanStyle); onContentChange() }
            )
        }
        item {
            FormatButton(
                icon = Icons.Default.Title,
                active = false,
                onClick = { richTextState.toggleParagraphStyle(richTextState.currentParagraphStyle); onContentChange() }
            )
        }
        item {
            FormatButton(
                icon = Icons.AutoMirrored.Filled.FormatListBulleted,
                active = richTextState.isUnorderedList,
                onClick = { richTextState.toggleUnorderedList(); onContentChange() }
            )
        }
        item {
            FormatButton(
                icon = Icons.Default.FormatListNumbered,
                active = richTextState.isOrderedList,
                onClick = { richTextState.toggleOrderedList(); onContentChange() }
            )
        }
    }
}

@Composable
private fun FormatButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    active: Boolean,
    onClick: () -> Unit
) {
    IconButton(onClick = onClick) {
        Icon(icon, null, tint = if (active) BrandPurple else TextSecondary)
    }
}
