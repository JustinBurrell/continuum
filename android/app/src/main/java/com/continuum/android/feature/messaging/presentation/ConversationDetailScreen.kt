package com.continuum.android.feature.messaging.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.messaging.domain.Message

@Composable
fun ConversationDetailScreen(
    conversationId: String,
    participantName: String,
    participantId: String = "",
    onNavigateBack: () -> Unit,
    onOpenParticipantProfile: (String) -> Unit = {},
    viewModel: MessagingViewModel = hiltViewModel()
) {
    val state by viewModel.detailState.collectAsStateWithLifecycle()
    val isDemo = LocalIsDemo.current
    val listState = rememberLazyListState()
    var messageInput by remember { mutableStateOf("") }
    var showSearch by remember { mutableStateOf(false) }

    val currentUserId = remember { viewModel.currentUserId }

    LaunchedEffect(conversationId) {
        viewModel.setParticipantName(participantName)
        viewModel.loadMessages(conversationId)
    }

    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) {
            listState.scrollToItem(state.messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            Column {
                MinimalTopBar(
                    title = participantName,
                    onNavigateBack = onNavigateBack,
                    onTitleClick = participantId.takeIf { it.isNotBlank() }?.let { pid ->
                        { onOpenParticipantProfile(pid) }
                    },
                    actions = {
                        IconButton(onClick = { showSearch = !showSearch }) {
                            Icon(
                                if (showSearch) Icons.Default.Close else Icons.Default.Search,
                                contentDescription = "Search messages",
                                tint = TextSecondary
                            )
                        }
                    }
                )
                if (showSearch) {
                    OutlinedTextField(
                        value = state.searchQuery,
                        onValueChange = viewModel::setMessageSearch,
                        placeholder = { Text("Search in conversation…") },
                        leadingIcon = { Icon(Icons.Default.Search, null, tint = TextMuted) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrandPurple,
                            cursorColor = BrandPurple
                        )
                    )
                }
            }
        },
        bottomBar = {
            if (!isDemo) {
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
                            value = messageInput,
                            onValueChange = { messageInput = it },
                            placeholder = { Text("Type a message...") },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(24.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandPurple,
                                unfocusedBorderColor = Border
                            )
                        )
                        IconButton(
                            onClick = {
                                val content = messageInput.trim()
                                if (content.isNotBlank()) {
                                    viewModel.sendMessage(conversationId, content)
                                    messageInput = ""
                                }
                            },
                            enabled = messageInput.isNotBlank()
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.Send,
                                "Send",
                                tint = if (messageInput.isNotBlank()) BrandPurple else TextMuted
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        when {
            state.isLoading && state.messages.isEmpty() -> {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxSize().padding(innerPadding)
                ) {
                    items(6) {
                        SkeletonLoader(modifier = Modifier.fillMaxWidth(0.7f).height(40.dp))
                    }
                }
            }

            state.messages.isEmpty() -> {
                Box(Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                    Text(
                        "Say hello to $participantName!",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }
            }

            else -> {
                LazyColumn(
                    state = listState,
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    reverseLayout = false,
                    modifier = Modifier.fillMaxSize().padding(innerPadding)
                ) {
                    items(state.messages, key = { it.id }) { message ->
                        MessageBubble(
                            message = message,
                            isMine = message.senderId == currentUserId,
                            onSenderProfileClick =
                                if (message.senderId != currentUserId && message.senderId.isNotBlank()) {
                                    { onOpenParticipantProfile(message.senderId) }
                                } else {
                                    null
                                }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MessageBubble(message: Message, isMine: Boolean, onSenderProfileClick: (() -> Unit)?) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
    ) {
        Surface(
            color = if (isMine) BrandPurple else PageBackground,
            shape = RoundedCornerShape(
                topStart = 18.dp,
                topEnd = 18.dp,
                bottomStart = if (isMine) 18.dp else 4.dp,
                bottomEnd = if (isMine) 4.dp else 18.dp
            ),
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)) {
                if (!isMine) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.then(
                            if (onSenderProfileClick != null) {
                                Modifier.clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = null,
                                    onClick = onSenderProfileClick
                                )
                            } else {
                                Modifier
                            }
                        )
                    ) {
                        Text(
                            text = message.senderName,
                            style = MaterialTheme.typography.labelMedium,
                            color = if (onSenderProfileClick != null) BrandPurple else TextPrimary
                        )
                        VerifiedRoleBadges(roles = message.senderRoles, expanded = false)
                    }
                }
                Text(
                    text = message.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (isMine) White else TextPrimary
                )
                Text(
                    text = message.createdAt.take(16).replace("T", " "),
                    style = MaterialTheme.typography.labelSmall,
                    color = if (isMine) White.copy(alpha = 0.7f) else TextMuted,
                    modifier = Modifier.align(Alignment.End)
                )
            }
        }
    }
}
