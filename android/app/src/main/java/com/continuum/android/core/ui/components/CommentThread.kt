package com.continuum.android.core.ui.components

import androidx.compose.foundation.background
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
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.foundation.text.ClickableText
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.theme.*
import com.continuum.android.core.ui.utils.toDisplayDate
import com.continuum.android.feature.social.domain.Comment
import com.continuum.android.feature.social.domain.UserSearchResult
import kotlinx.coroutines.launch

@Composable
fun CommentThread(
    comments: List<Comment>,
    onAddComment: (content: String, parentId: String?) -> Unit,
    onLikeComment: (commentId: String) -> Unit,
    onDeleteComment: ((commentId: String) -> Unit)? = null,
    onUserClick: ((userId: String) -> Unit)? = null,
    onSearchUsers: (suspend (String) -> List<UserSearchResult>)? = null,
    onLookupUsername: (suspend (String) -> List<UserSearchResult>)? = null,
    isSending: Boolean = false,
    readOnly: Boolean = false,
    highlightCommentId: String? = null,
    onCommentPositioned: ((commentId: String, absoluteY: Float) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    var newComment by remember { mutableStateOf("") }
    var replyingTo by remember { mutableStateOf<String?>(null) }
    var mentionQuery by remember { mutableStateOf<String?>(null) }
    var mentionStart by remember { mutableStateOf(0) }
    var mentionSuggestions by remember { mutableStateOf<List<UserSearchResult>>(emptyList()) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(mentionQuery) {
        val q = mentionQuery
        mentionSuggestions = if (q != null && q.length >= 2 && onSearchUsers != null) {
            onSearchUsers(q)
        } else emptyList()
    }

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
                onReply = if (readOnly) null else { { replyingTo = comment.id } },
                onDelete = if (readOnly) null else onDeleteComment?.let { { it(comment.id) } },
                onUserClick = onUserClick?.let { nav -> comment.authorId?.let { { nav(it) } } },
                onMentionUserClick = onUserClick,
                onSearchUsers = onSearchUsers,
                onLookupUsername = onLookupUsername,
                readOnly = readOnly,
                depth = 0,
                isHighlighted = highlightCommentId == comment.id,
                onPositioned = if (highlightCommentId == comment.id) onCommentPositioned else null
            )
            comment.replies.forEach { reply ->
                CommentItem(
                    comment = reply,
                    onLike = { onLikeComment(reply.id) },
                    onReply = null,
                    onDelete = if (readOnly) null else onDeleteComment?.let { { it(reply.id) } },
                    onUserClick = onUserClick?.let { nav -> reply.authorId?.let { { nav(it) } } },
                    onMentionUserClick = onUserClick,
                    onSearchUsers = onSearchUsers,
                    onLookupUsername = onLookupUsername,
                    readOnly = readOnly,
                    depth = 1,
                    isHighlighted = highlightCommentId == reply.id,
                    onPositioned = if (highlightCommentId == reply.id) onCommentPositioned else null
                )
            }
        }

        if (!readOnly && replyingTo != null) {
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

        if (!readOnly) {
            // Mention suggestion list
            if (mentionSuggestions.isNotEmpty() && mentionQuery != null) {
                Surface(
                    shape = MaterialTheme.shapes.medium,
                    tonalElevation = 4.dp,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        mentionSuggestions.take(5).forEach { user ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        val before = newComment.slice(0 until mentionStart)
                                        val inserted = "@${user.username} "
                                        newComment = before + inserted
                                        mentionQuery = null
                                        mentionSuggestions = emptyList()
                                    }
                                    .padding(horizontal = 16.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                AvatarInitials(name = user.fullName, size = 28.dp)
                                Column {
                                    Text(user.fullName, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                                    Text("@${user.username}", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                                }
                            }
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
                    onValueChange = { newValue ->
                        newComment = newValue
                        val lastAt = newValue.lastIndexOf('@')
                        if (lastAt >= 0) {
                            val afterAt = newValue.substring(lastAt + 1)
                            if (afterAt.none { it.isWhitespace() } &&
                                afterAt.all { it.isLetterOrDigit() || it == '_' }
                            ) {
                                mentionQuery = afterAt
                                mentionStart = lastAt
                            } else {
                                mentionQuery = null
                                mentionSuggestions = emptyList()
                            }
                        } else {
                            mentionQuery = null
                            mentionSuggestions = emptyList()
                        }
                    },
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
}

@Composable
private fun CommentItem(
    comment: Comment,
    onLike: () -> Unit,
    onReply: (() -> Unit)?,
    onDelete: (() -> Unit)?,
    onUserClick: (() -> Unit)?,
    onMentionUserClick: ((userId: String) -> Unit)? = null,
    onSearchUsers: (suspend (String) -> List<UserSearchResult>)? = null,
    onLookupUsername: (suspend (String) -> List<UserSearchResult>)? = null,
    readOnly: Boolean,
    depth: Int,
    isHighlighted: Boolean = false,
    onPositioned: ((commentId: String, absoluteY: Float) -> Unit)? = null
) {
    val scope = rememberCoroutineScope()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(
                if (isHighlighted) Modifier.background(BrandPurple.copy(alpha = 0.08f))
                else Modifier
            )
            .then(
                if (onPositioned != null) {
                    Modifier.onGloballyPositioned { coords ->
                        onPositioned(comment.id, coords.positionInRoot().y)
                    }
                } else Modifier
            )
            .padding(start = (depth * 32).dp),
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
    ) {
        AvatarInitials(
            name = comment.authorName,
            imageUrl = comment.authorAvatar,
            size = if (depth == 0) 32.dp else 24.dp,
            modifier = if (onUserClick != null) Modifier.clickable(onClick = onUserClick) else Modifier
        )
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    comment.authorName,
                    style = MaterialTheme.typography.labelMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = if (onUserClick != null) BrandPurple else TextPrimary,
                    textDecoration = if (onUserClick != null) TextDecoration.Underline else TextDecoration.None,
                    modifier = if (onUserClick != null) Modifier.clickable(onClick = onUserClick) else Modifier
                )
                if (comment.authorRoles.isNotEmpty()) {
                    VerifiedRoleBadges(roles = comment.authorRoles, expanded = false)
                }
                Text(comment.createdAt.toDisplayDate(), style = MaterialTheme.typography.labelSmall, color = TextMuted)
            }
            val mentionRegex = Regex("@([a-zA-Z0-9_]+)")
            val hasMentions = mentionRegex.containsMatchIn(comment.content)
            if (hasMentions) {
                val annotated = buildAnnotatedString {
                    var lastEnd = 0
                    for (match in mentionRegex.findAll(comment.content)) {
                        if (match.range.first > lastEnd)
                            append(comment.content.substring(lastEnd, match.range.first))
                        pushStringAnnotation("mention", match.groupValues[1])
                        withStyle(SpanStyle(color = BrandPurple, fontWeight = FontWeight.SemiBold)) {
                            append(match.value)
                        }
                        pop()
                        lastEnd = match.range.last + 1
                    }
                    if (lastEnd < comment.content.length)
                        append(comment.content.substring(lastEnd))
                }
                ClickableText(
                    text = annotated,
                    style = MaterialTheme.typography.bodySmall.copy(color = TextSecondary),
                    onClick = { offset ->
                        annotated.getStringAnnotations("mention", offset, offset)
                            .firstOrNull()?.let { ann ->
                                scope.launch {
                                    val lookup = onLookupUsername ?: onSearchUsers ?: return@launch
                                    val results = lookup(ann.item)
                                    results.firstOrNull()?.id
                                        ?.let { onMentionUserClick?.invoke(it) }
                                }
                            }
                    }
                )
            } else {
                Text(comment.content, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (readOnly) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.ThumbUp, null, modifier = Modifier.size(14.dp), tint = TextMuted)
                        Spacer(Modifier.width(4.dp))
                        Text("${comment.likes}", style = MaterialTheme.typography.labelSmall, color = TextMuted)
                    }
                } else {
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
}

private fun countAll(comments: List<Comment>): Int =
    comments.sumOf { 1 + it.replies.size }
