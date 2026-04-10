package com.continuum.android.core.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.social.domain.Comment

@Composable
fun CommentThread(
    comments: List<Comment>,
    onAddComment: (content: String, parentId: String?) -> Unit,
    onLikeComment: (commentId: String) -> Unit,
    onDeleteComment: ((commentId: String) -> Unit)? = null,
    onUserClick: ((userId: String) -> Unit)? = null,
    isSending: Boolean = false,
    modifier: Modifier = Modifier
) {
    var newComment by remember { mutableStateOf("") }
    var replyingTo by remember { mutableStateOf<String?>(null) }

    Column(modifier = modifier, verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
        Text(
            "Comments (${countAll(comments)})",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            color = TextPrimary
        )

        comments.forEach { comment ->
            CommentItem(
                comment = comment,
                onLike = { onLikeComment(comment.id) },
                onReply = { replyingTo = comment.id },
                onDelete = onDeleteComment?.let { { it(comment.id) } },
                onUserClick = onUserClick?.let { nav -> comment.authorId?.let { { nav(it) } } },
                depth = 0
            )
            comment.replies.forEach { reply ->
                CommentItem(
                    comment = reply,
                    onLike = { onLikeComment(reply.id) },
                    onReply = null,
                    onDelete = onDeleteComment?.let { { it(reply.id) } },
                    onUserClick = onUserClick?.let { nav -> reply.authorId?.let { { nav(it) } } },
                    depth = 1
                )
            }
        }

        if (replyingTo != null) {
            Surface(color = BrandPurple.copy(alpha = 0.08f), shape = AppShape.chip) {
                Row(
                    Modifier.padding(horizontal = Spacing.sm, vertical = Spacing.xs),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Replying to comment", style = MaterialTheme.typography.labelSmall, color = BrandPurple)
                    Spacer(Modifier.width(Spacing.xs))
                    IconButton(onClick = { replyingTo = null }, modifier = Modifier.size(16.dp)) {
                        Icon(Icons.Default.Close, "Cancel reply", tint = BrandPurple, modifier = Modifier.size(14.dp))
                    }
                }
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            OutlinedTextField(
                value = newComment,
                onValueChange = { newComment = it },
                placeholder = { Text("Add a comment…") },
                modifier = Modifier.weight(1f),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BrandPurple,
                    unfocusedBorderColor = Border
                )
            )
            Spacer(Modifier.width(Spacing.sm))
            IconButton(
                onClick = {
                    if (newComment.isNotBlank()) {
                        onAddComment(newComment.trim(), replyingTo)
                        newComment = ""
                        replyingTo = null
                    }
                },
                enabled = newComment.isNotBlank() && !isSending
            ) {
                if (isSending) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = BrandPurple)
                } else {
                    Icon(Icons.Default.Send, "Send", tint = if (newComment.isNotBlank()) BrandPurple else TextMuted)
                }
            }
        }
    }
}

@Composable
private fun CommentItem(
    comment: Comment,
    onLike: () -> Unit,
    onReply: (() -> Unit)?,
    onDelete: (() -> Unit)?,
    onUserClick: (() -> Unit)?,
    depth: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = (depth * 32).dp),
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
    ) {
        AvatarInitials(
            name = comment.authorName,
            size = if (depth == 0) 32.dp else 24.dp,
            modifier = if (onUserClick != null) Modifier.clickable(onClick = onUserClick) else Modifier
        )
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    comment.authorName,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = if (onUserClick != null) BrandPurple else TextPrimary,
                    modifier = if (onUserClick != null) Modifier.clickable(onClick = onUserClick) else Modifier
                )
                Spacer(Modifier.width(Spacing.sm))
                Text(comment.createdAt.take(10), style = MaterialTheme.typography.labelSmall, color = TextMuted)
            }
            Text(comment.content, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            Row(verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onLike, contentPadding = PaddingValues(0.dp)) {
                    Icon(Icons.Default.ThumbUp, null, modifier = Modifier.size(14.dp), tint = TextMuted)
                    Spacer(Modifier.width(4.dp))
                    Text("${comment.likes}", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                }
                onReply?.let {
                    TextButton(onClick = it, contentPadding = PaddingValues(0.dp)) {
                        Text("Reply", style = MaterialTheme.typography.labelSmall, color = BrandPurple)
                    }
                }
                onDelete?.let {
                    TextButton(onClick = it, contentPadding = PaddingValues(0.dp)) {
                        Text("Delete", style = MaterialTheme.typography.labelSmall, color = ErrorRed)
                    }
                }
            }
        }
    }
}

private fun countAll(comments: List<Comment>): Int =
    comments.sumOf { 1 + it.replies.size }
