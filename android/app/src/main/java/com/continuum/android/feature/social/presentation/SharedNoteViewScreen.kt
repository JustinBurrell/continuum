package com.continuum.android.feature.social.presentation

import androidx.compose.foundation.clickable
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
import com.mohamedrejeb.richeditor.model.rememberRichTextState
import com.mohamedrejeb.richeditor.ui.material3.RichText

@Composable
fun SharedNoteViewScreen(
    noteId: String,
    onNavigateBack: () -> Unit,
    onCommentAuthorClick: (String) -> Unit = {},
    viewModel: SocialViewModel = hiltViewModel()
) {
    val state by viewModel.sharedNoteState.collectAsStateWithLifecycle()
    val commentsState by viewModel.threadCommentsState.collectAsStateWithLifecycle()
    val isDemo = LocalIsDemo.current
    val richTextState = rememberRichTextState()

    LaunchedEffect(noteId) {
        viewModel.loadSharedNote(noteId)
        viewModel.loadThreadComments("note", noteId)
    }
    LaunchedEffect(state.note?.content) {
        state.note?.content?.let { richTextState.setHtml(it) }
    }

    Scaffold(
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
                        // "Created by" attribution
                        val ownerName = state.note!!.ownerName
                        val ownerUserId = state.note!!.ownerUserId
                        if (!ownerName.isNullOrBlank() && ownerUserId != null) {
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
