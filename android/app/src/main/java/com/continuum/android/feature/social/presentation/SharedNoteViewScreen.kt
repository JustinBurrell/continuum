package com.continuum.android.feature.social.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.notes.presentation.NotesViewModel
import com.mohamedrejeb.richeditor.model.rememberRichTextState
import com.mohamedrejeb.richeditor.ui.material3.RichText

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SharedNoteViewScreen(
    noteId: String,
    currentUserId: String? = null,
    onNavigateBack: () -> Unit,
    onCommentAuthorClick: (String) -> Unit = {},
    onNavigateToSet: ((String) -> Unit)? = null,
    viewModel: SocialViewModel = hiltViewModel(),
    notesViewModel: NotesViewModel = hiltViewModel()
) {
    val state by viewModel.sharedNoteState.collectAsStateWithLifecycle()
    val commentsState by viewModel.threadCommentsState.collectAsStateWithLifecycle()
    val detailState by notesViewModel.detailState.collectAsStateWithLifecycle()
    val isDemo = LocalIsDemo.current
    val richTextState = rememberRichTextState()
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(noteId) {
        viewModel.loadSharedNote(noteId)
        viewModel.loadThreadComments("note", noteId)
    }
    LaunchedEffect(state.note?.content) {
        state.note?.content?.let { richTextState.setHtml(it) }
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
        notesViewModel.clearFlashcardGeneration()
    }

    // Flashcard generation error snackbar
    LaunchedEffect(detailState.flashcardGenerationError) {
        val err = detailState.flashcardGenerationError ?: return@LaunchedEffect
        snackbarHostState.showSnackbar("Failed to generate flashcards: $err")
        notesViewModel.clearFlashcardGeneration()
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            MinimalTopBar(
                title = state.note?.title ?: "Shared Note",
                onNavigateBack = onNavigateBack
            )
        }
    ) { innerPadding ->
        when {
            state.isLoading && state.note == null -> {
                Column(modifier = Modifier.padding(innerPadding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    repeat(4) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(20.dp)) }
                }
            }

            state.note != null -> {
                androidx.compose.foundation.lazy.LazyColumn(
                    contentPadding = PaddingValues(bottom = 24.dp),
                    modifier = Modifier.fillMaxSize().padding(innerPadding)
                ) {
                    item {
                        // "Created by" attribution — hide if viewing own content
                        val ownerName = state.note!!.ownerName
                        val ownerUserId = state.note!!.ownerUserId
                        val isOwnContent = ownerUserId != null && ownerUserId == currentUserId
                        if (!ownerName.isNullOrBlank() && ownerUserId != null && !isOwnContent) {
                            TextButton(
                                onClick = { onCommentAuthorClick(ownerUserId) },
                                modifier = Modifier.padding(horizontal = 8.dp)
                            ) {
                                Icon(Icons.Default.Person, contentDescription = null, tint = BrandPurple, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Created by $ownerName", color = BrandPurple, style = MaterialTheme.typography.labelMedium)
                            }
                        }

                        // Note content
                        RichText(
                            state = richTextState,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                        )

                        // Generate Flashcards button
                        if (!isDemo) {
                            OutlinedButton(
                                onClick = { if (!detailState.isGeneratingFlashcards) notesViewModel.generateFlashcards(noteId) },
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
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

                        HorizontalDivider(color = Border, modifier = Modifier.padding(horizontal = 16.dp))
                        Spacer(Modifier.height(12.dp))

                        // CommentThread — full reply/like/delete support
                        CommentThread(
                            comments = commentsState.comments,
                            onAddComment = { content, parentId ->
                                viewModel.addThreadComment(content, parentId)
                            },
                            onLikeComment = { commentId -> viewModel.likeThreadComment(commentId) },
                            onDeleteComment = if (isDemo) null else { commentId -> viewModel.deleteThreadComment(commentId) },
                            onUserClick = { userId -> onCommentAuthorClick(userId) },
                            isSending = commentsState.isSending,
                            readOnly = isDemo,
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
                        )
                    }
                }
            }

            else -> {
                EmptyState(
                    icon = Icons.Default.ErrorOutline,
                    headline = "Failed to load note",
                    subtext = state.error ?: "",
                    modifier = Modifier.fillMaxSize().padding(innerPadding)
                )
            }
        }
    }
}
