package com.continuum.android.feature.notes.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
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
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.social.presentation.SocialViewModel
import com.mohamedrejeb.richeditor.model.rememberRichTextState
import com.mohamedrejeb.richeditor.ui.material3.RichText
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteDetailScreen(
    noteId: String,
    onNavigateBack: () -> Unit,
    onEdit: (String) -> Unit,
    networkMonitor: NetworkMonitor,
    onNavigateToSet: ((String) -> Unit)? = null,
    onUserProfileClick: ((String) -> Unit)? = null,
    viewModel: NotesViewModel = hiltViewModel(),
    socialViewModel: SocialViewModel = hiltViewModel()
) {
    val detailState by viewModel.detailState.collectAsStateWithLifecycle()
    val commentsState by socialViewModel.threadCommentsState.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)
    val isDemo = LocalIsDemo.current
    val note = detailState.note
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    var showSummary by remember { mutableStateOf(false) }
    var summaryTab by remember { mutableIntStateOf(0) }

    LaunchedEffect(noteId) {
        viewModel.loadNote(noteId)
        socialViewModel.loadThreadComments("note", noteId)
    }

    // Flashcard generation success snackbar
    LaunchedEffect(detailState.generatedFlashcardSetId) {
        val setId = detailState.generatedFlashcardSetId ?: return@LaunchedEffect
        val result = snackbarHostState.showSnackbar(
            message = "Flashcard set created!",
            actionLabel = if (onNavigateToSet != null) "View" else null,
            duration = SnackbarDuration.Long
        )
        if (result == SnackbarResult.ActionPerformed && onNavigateToSet != null) {
            onNavigateToSet(setId)
        }
        viewModel.clearFlashcardGeneration()
    }

    // Flashcard generation error snackbar
    LaunchedEffect(detailState.flashcardGenerationError) {
        val err = detailState.flashcardGenerationError ?: return@LaunchedEffect
        snackbarHostState.showSnackbar("Failed to generate flashcards: $err")
        viewModel.clearFlashcardGeneration()
    }

    val richTextState = rememberRichTextState()
    LaunchedEffect(note?.content) {
        note?.content?.let { richTextState.setHtml(it) }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            MinimalTopBar(
                title = "Note",
                onNavigateBack = onNavigateBack,
                actions = {
                    if (note != null && !isDemo) {
                        IconButton(onClick = { onEdit(noteId) }) {
                            Icon(Icons.Default.Edit, "Edit", tint = TextPrimary)
                        }
                    }
                }
            )
        }
    ) { innerPadding ->
        Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
            when {
                detailState.isLoading && note == null -> {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        repeat(4) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(20.dp)) }
                    }
                }

                detailState.error != null && note == null -> {
                    EmptyState(
                        icon = Icons.Default.ErrorOutline,
                        headline = "Failed to load note",
                        subtext = detailState.error ?: "",
                        modifier = Modifier.fillMaxSize()
                    )
                }

                note != null -> {
                    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
                        if (!isOnline) OfflineBanner()

                        // "Created by" attribution (shown for shared/owned-by-others notes)
                        if (note.ownerUserId != null && onUserProfileClick != null) {
                            TextButton(
                                onClick = { onUserProfileClick(note.ownerUserId) },
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Icon(Icons.Default.Person, contentDescription = null, tint = BrandPurple, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text(
                                    "Created by ${note.ownerName ?: "Unknown"}",
                                    color = BrandPurple,
                                    style = MaterialTheme.typography.labelMedium
                                )
                            }
                        }

                        // Google Doc badge (read-only label — refresh not wired)
                        if (note.googleDocId != null) {
                            Text(
                                "Synced from Google Docs",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextMuted,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                            )
                        }

                        // Note title + content
                        Text(
                            note.title,
                            style = MaterialTheme.typography.headlineMedium,
                            color = TextPrimary,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                        )
                        RichText(
                            state = richTextState,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                        )

                        Spacer(Modifier.height(16.dp))

                        // Generate flashcards button
                        if (!note.hasFlashcards) {
                            OutlinedButton(
                                onClick = { if (!detailState.isGeneratingFlashcards) viewModel.generateFlashcards(noteId) },
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                                shape = MaterialTheme.shapes.small,
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = BrandPurple),
                                enabled = !detailState.isGeneratingFlashcards
                            ) {
                                if (detailState.isGeneratingFlashcards) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp, color = BrandPurple)
                                    Spacer(Modifier.width(8.dp))
                                    Text("Generating…")
                                } else {
                                    Icon(Icons.Default.AutoAwesome, null, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text("Generate Flashcards")
                                }
                            }
                        }

                        Spacer(Modifier.height(12.dp))

                        // AI Summary section
                        ContinuumCard(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Quick Summary", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                                    IconButton(onClick = { showSummary = !showSummary }) {
                                        Icon(if (showSummary) Icons.Default.ExpandLess else Icons.Default.ExpandMore, null, tint = TextSecondary)
                                    }
                                }
                                if (showSummary) {
                                    if (!note.hasSummary) {
                                        Spacer(Modifier.height(8.dp))
                                        ContinuumButton(
                                            text = "Generate Summary",
                                            onClick = { viewModel.generateSummary(noteId) },
                                            modifier = Modifier.fillMaxWidth(),
                                            loading = detailState.isLoading
                                        )
                                    } else {
                                        TabRow(selectedTabIndex = summaryTab, containerColor = PageBackground, contentColor = BrandPurple) {
                                            Tab(selected = summaryTab == 0, onClick = { summaryTab = 0 }) {
                                                Text("Quick", modifier = Modifier.padding(vertical = 8.dp))
                                            }
                                            Tab(selected = summaryTab == 1, onClick = { summaryTab = 1 }) {
                                                Text("Detailed", modifier = Modifier.padding(vertical = 8.dp))
                                            }
                                        }
                                        Spacer(Modifier.height(8.dp))
                                        Text(
                                            text = if (summaryTab == 0) note.quickSummary ?: "" else note.detailedSummary ?: "",
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = TextSecondary
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(Modifier.height(24.dp))

                        // Comments
                        CommentThread(
                            comments = commentsState.comments,
                            onAddComment = { content, parentId -> socialViewModel.addThreadComment(content, parentId) },
                            onLikeComment = { commentId -> socialViewModel.likeThreadComment(commentId) },
                            onDeleteComment = if (isDemo) null else { commentId -> socialViewModel.deleteThreadComment(commentId) },
                            onUserClick = onUserProfileClick,
                            isSending = commentsState.isSending,
                            readOnly = isDemo,
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
                        )

                        Spacer(Modifier.height(32.dp))
                    }
                }
            }
        }
    }
}
