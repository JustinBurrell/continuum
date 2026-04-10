package com.continuum.android.feature.social.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.social.domain.Comment
import com.mohamedrejeb.richeditor.model.rememberRichTextState
import com.mohamedrejeb.richeditor.ui.material3.RichText

@Composable
fun SharedNoteViewScreen(
    noteId: String,
    onNavigateBack: () -> Unit,
    viewModel: SocialViewModel = hiltViewModel()
) {
    val state by viewModel.sharedNoteState.collectAsStateWithLifecycle()
    var commentInput by remember { mutableStateOf("") }
    val richTextState = rememberRichTextState()

    LaunchedEffect(noteId) { viewModel.loadSharedNote(noteId) }
    LaunchedEffect(state.note?.content) {
        state.note?.content?.let { richTextState.setHtml(it) }
    }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = state.note?.title ?: "Shared Note",
                onNavigateBack = onNavigateBack
            )
        },
        bottomBar = {
            Surface(shadowElevation = 8.dp) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                        .imePadding(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = commentInput,
                        onValueChange = { commentInput = it },
                        placeholder = { Text("Add a comment...") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(24.dp),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, unfocusedBorderColor = Border)
                    )
                    IconButton(
                        onClick = {
                            if (commentInput.isNotBlank()) {
                                viewModel.addComment(noteId, commentInput)
                                commentInput = ""
                            }
                        },
                        enabled = commentInput.isNotBlank() && !state.isSendingComment
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, "Send", tint = if (commentInput.isNotBlank()) BrandPurple else TextMuted)
                    }
                }
            }
        }
    ) { innerPadding ->
        when {
            state.isLoading && state.note == null -> {
                Column(modifier = Modifier.padding(innerPadding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    repeat(4) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(20.dp)) }
                }
            }

            state.note != null -> {
                LazyColumn(
                    contentPadding = PaddingValues(bottom = 16.dp),
                    modifier = Modifier.fillMaxSize().padding(innerPadding)
                ) {
                    item {
                        // Note content
                        RichText(
                            state = richTextState,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                        )
                        HorizontalDivider(color = Border, modifier = Modifier.padding(horizontal = 16.dp))
                        Text(
                            "Comments (${state.note!!.comments.size})",
                            style = MaterialTheme.typography.headlineSmall,
                            color = TextPrimary,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                        )
                    }

                    if (state.note!!.comments.isEmpty()) {
                        item {
                            EmptyState(
                                icon = Icons.Default.ChatBubbleOutline,
                                headline = "No comments yet",
                                subtext = "Be the first to comment",
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    } else {
                        items(state.note!!.comments, key = { it.id }) { comment ->
                            CommentItem(
                                comment = comment,
                                onLike = { viewModel.likeComment(noteId, comment.id) },
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                            )
                        }
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

@Composable
private fun CommentItem(
    comment: Comment,
    onLike: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        ContinuumCard(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AvatarInitials(name = comment.authorName, modifier = Modifier.size(28.dp).clip(CircleShape))
                    Text(comment.authorName, style = MaterialTheme.typography.labelLarge, color = TextPrimary)
                    Text(comment.createdAt.take(10), style = MaterialTheme.typography.bodySmall, color = TextMuted)
                }
                Text(comment.content, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onLike, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.ThumbUp, null, tint = TextMuted, modifier = Modifier.size(16.dp))
                    }
                    Text("${comment.likes}", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                }
            }
        }

        // Threaded replies — indented
        comment.replies.forEach { reply ->
            CommentItem(
                comment = reply,
                onLike = {},
                modifier = Modifier.padding(start = 24.dp, top = 4.dp)
            )
        }
    }
}
