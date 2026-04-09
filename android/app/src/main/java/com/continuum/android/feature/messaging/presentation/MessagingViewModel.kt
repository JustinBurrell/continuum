package com.continuum.android.feature.messaging.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.network.SocketManager
import com.continuum.android.feature.messaging.data.repository.MessagingRepository
import com.continuum.android.feature.messaging.domain.Conversation
import com.continuum.android.feature.messaging.domain.Message
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class ConversationsUiState(
    val conversations: List<Conversation> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

data class ConversationDetailUiState(
    val messages: List<Message> = emptyList(),
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val participantOnline: Boolean = false
)

@HiltViewModel
class MessagingViewModel @Inject constructor(
    private val repository: MessagingRepository,
    private val socketManager: SocketManager
) : ViewModel() {

    private val _conversationsState = MutableStateFlow(ConversationsUiState())
    val conversationsState: StateFlow<ConversationsUiState> = _conversationsState.asStateFlow()

    private val _detailState = MutableStateFlow(ConversationDetailUiState())
    val detailState: StateFlow<ConversationDetailUiState> = _detailState.asStateFlow()

    private var currentConversationId: String? = null

    fun loadConversations() {
        viewModelScope.launch {
            _conversationsState.update { it.copy(isLoading = true, error = null) }
            repository.getConversations()
                .onSuccess { convos -> _conversationsState.update { it.copy(conversations = convos, isLoading = false) } }
                .onFailure { e -> _conversationsState.update { it.copy(isLoading = false, error = e.message) } }
        }

        // Observe real-time new messages — update last message preview in conversation list
        viewModelScope.launch {
            socketManager.newMessageFlow.collect { event ->
                _conversationsState.update { state ->
                    state.copy(conversations = state.conversations.map { convo ->
                        if (convo.id == event.optString("conversationId")) {
                            convo.copy(lastMessage = event.optString("content", convo.lastMessage))
                        } else convo
                    })
                }
            }
        }
    }

    fun loadMessages(conversationId: String) {
        currentConversationId = conversationId
        viewModelScope.launch {
            _detailState.update { it.copy(isLoading = true) }
            repository.getMessages(conversationId)
                .onSuccess { messages -> _detailState.update { it.copy(messages = messages, isLoading = false) } }
                .onFailure { _detailState.update { it.copy(isLoading = false) } }
        }

        // Observe incoming real-time messages for this conversation
        viewModelScope.launch {
            socketManager.newMessageFlow.collect { event ->
                val convId = event.optString("conversationId")
                if (convId == conversationId) {
                    val newMessage = Message(
                        id = event.optString("_id", UUID.randomUUID().toString()),
                        conversationId = convId,
                        senderId = event.optString("senderId"),
                        senderName = event.optString("senderName"),
                        content = event.optString("content"),
                        createdAt = event.optString("createdAt")
                    )
                    _detailState.update { it.copy(messages = it.messages + newMessage) }
                }
            }
        }
    }

    fun sendMessage(conversationId: String, content: String, currentUserId: String, currentUserName: String) {
        val optimisticId = UUID.randomUUID().toString()
        val optimisticMessage = Message(
            id = optimisticId,
            conversationId = conversationId,
            senderId = currentUserId,
            senderName = currentUserName,
            content = content,
            createdAt = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
                .apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
                .format(java.util.Date()),
            isOptimistic = true
        )

        // Optimistic update
        _detailState.update { it.copy(messages = it.messages + optimisticMessage) }

        viewModelScope.launch {
            _detailState.update { it.copy(isSending = true) }
            repository.sendMessage(conversationId, content)
                .onSuccess { confirmed ->
                    _detailState.update { state ->
                        state.copy(
                            messages = state.messages.map { if (it.id == optimisticId) confirmed else it },
                            isSending = false
                        )
                    }
                }
                .onFailure {
                    // Remove optimistic message on failure
                    _detailState.update { state ->
                        state.copy(
                            messages = state.messages.filter { it.id != optimisticId },
                            isSending = false
                        )
                    }
                }
        }
    }
}
