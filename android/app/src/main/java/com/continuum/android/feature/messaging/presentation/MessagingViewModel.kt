package com.continuum.android.feature.messaging.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.network.SocketManager
import com.continuum.android.feature.messaging.data.repository.MessagingRepository
import com.continuum.android.feature.messaging.domain.Conversation
import com.continuum.android.feature.messaging.domain.Message
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import javax.inject.Inject

data class ConversationsUiState(
    val conversations: List<Conversation> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val searchQuery: String = ""
)

data class ConversationDetailUiState(
    val messages: List<Message> = emptyList(),
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val participantName: String = "",
    val participantOnline: Boolean = false,
    val searchQuery: String = ""
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
    private var searchJob: Job? = null

    val currentUserId: String
        get() = runCatching { repository.currentUserId() }.getOrDefault("")

    fun loadConversations() {
        val query = _conversationsState.value.searchQuery.trim()
        if (query.isBlank()) {
            viewModelScope.launch {
                _conversationsState.update { it.copy(isLoading = true, error = null) }
                repository.getConversationsFlow().collect { result ->
                    result
                        .onSuccess { convos -> _conversationsState.update { it.copy(conversations = convos, isLoading = false) } }
                        .onFailure { e -> _conversationsState.update { it.copy(isLoading = false, error = e.message) } }
                }
            }
        } else {
            viewModelScope.launch {
                _conversationsState.update { it.copy(isLoading = true, error = null) }
                repository.getConversations(query)
                    .onSuccess { convos -> _conversationsState.update { it.copy(conversations = convos, isLoading = false) } }
                    .onFailure { e -> _conversationsState.update { it.copy(isLoading = false, error = e.message) } }
            }
        }

        viewModelScope.launch {
            socketManager.newMessageFlow.collect { raw ->
                val event = runCatching { JSONObject(raw) }.getOrNull() ?: return@collect
                val nested = event.optJSONObject("message")
                val convId = event.optString("conversationId").ifBlank { nested?.optString("conversationId").orEmpty() }
                val preview = nested?.optString("content").orEmpty().ifBlank { event.optString("content") }
                _conversationsState.update { state ->
                    state.copy(conversations = state.conversations.map { convo ->
                        if (convo.id == convId && preview.isNotBlank()) {
                            convo.copy(lastMessage = preview)
                        } else convo
                    })
                }
            }
        }
    }

    fun setConversationSearch(query: String) {
        _conversationsState.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(350)
            loadConversations()
        }
    }

    fun deleteConversation(conversationId: String) {
        viewModelScope.launch {
            repository.deleteConversation(conversationId).onSuccess {
                _conversationsState.update { state ->
                    state.copy(conversations = state.conversations.filter { it.id != conversationId })
                }
            }
        }
    }

    fun startConversation(participantId: String, onCreated: (String) -> Unit) {
        viewModelScope.launch {
            repository.startConversation(participantId).onSuccess { convo ->
                onCreated(convo.id)
            }
        }
    }

    fun loadMessages(conversationId: String) {
        currentConversationId = conversationId
        viewModelScope.launch {
            _detailState.update { it.copy(isLoading = true) }
            val query = _detailState.value.searchQuery.takeIf { it.isNotBlank() }
            repository.getMessages(conversationId, query)
                .onSuccess { messages -> _detailState.update { it.copy(messages = messages, isLoading = false) } }
                .onFailure { _detailState.update { it.copy(isLoading = false) } }
        }

        viewModelScope.launch {
            socketManager.newMessageFlow.collect { raw ->
                val newMessage = parseSocketMessage(raw, conversationId) ?: return@collect
                _detailState.update { it.copy(messages = it.messages + newMessage) }
            }
        }
    }

    fun setParticipantName(name: String) {
        _detailState.update { it.copy(participantName = name) }
    }

    fun setMessageSearch(query: String) {
        _detailState.update { it.copy(searchQuery = query) }
        val convId = currentConversationId ?: return
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(350)
            repository.getMessages(convId, query.takeIf { it.isNotBlank() })
                .onSuccess { messages -> _detailState.update { it.copy(messages = messages) } }
        }
    }

    fun sendMessage(conversationId: String, content: String) {
        val uid = currentUserId
        val optimisticId = UUID.randomUUID().toString()
        val optimisticMessage = Message(
            id = optimisticId,
            conversationId = conversationId,
            senderId = uid,
            senderName = "Me",
            senderRoles = emptyList(),
            content = content,
            createdAt = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
                .apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
                .format(java.util.Date()),
            isOptimistic = true
        )

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
                    _detailState.update { state ->
                        state.copy(
                            messages = state.messages.filter { it.id != optimisticId },
                            isSending = false
                        )
                    }
                }
        }
    }

    private fun parseSocketMessage(raw: String, activeConversationId: String): Message? {
        val root = runCatching { JSONObject(raw) }.getOrNull() ?: return null
        val msg = root.optJSONObject("message") ?: root
        val convId = root.optString("conversationId").ifBlank { msg.optString("conversationId") }
        if (convId != activeConversationId) return null

        val id = msg.optString("_id").ifBlank { UUID.randomUUID().toString() }
        val content = msg.optString("content")
        val createdAt = msg.optString("createdAt")
        val senderVal = msg.opt("senderId")
        return when (senderVal) {
            is JSONObject -> {
                val s = senderVal
                val sid = s.optString("_id").ifBlank { s.optString("id") }
                val senderName = when {
                    s.optString("firstName").isNotBlank() || s.optString("lastName").isNotBlank() ->
                        "${s.optString("firstName")} ${s.optString("lastName")}".trim()
                    else -> s.optString("username").ifBlank { "Someone" }
                }
                val roles = jsonStringList(s.optJSONArray("roles"))
                Message(
                    id = id,
                    conversationId = convId,
                    senderId = sid,
                    senderName = senderName,
                    senderRoles = roles,
                    content = content,
                    createdAt = createdAt
                )
            }
            else -> Message(
                id = id,
                conversationId = convId,
                senderId = msg.optString("senderId"),
                senderName = root.optString("senderName").ifBlank { "Someone" },
                senderRoles = jsonStringList(root.optJSONArray("senderRoles")),
                content = content,
                createdAt = createdAt
            )
        }
    }

    private fun jsonStringList(arr: JSONArray?): List<String> {
        if (arr == null) return emptyList()
        return buildList {
            for (i in 0 until arr.length()) {
                val t = arr.optString(i).takeIf { it.isNotBlank() }
                if (t != null) add(t)
            }
        }
    }
}
