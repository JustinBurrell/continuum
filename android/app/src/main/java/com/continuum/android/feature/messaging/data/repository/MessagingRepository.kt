package com.continuum.android.feature.messaging.data.repository

import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.messaging.data.remote.MessagingApiService
import com.continuum.android.feature.messaging.data.remote.dto.*
import com.continuum.android.feature.messaging.domain.Conversation
import com.continuum.android.feature.messaging.domain.Message
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MessagingRepository @Inject constructor(
    private val api: MessagingApiService,
    private val tokenManager: TokenManager
) {

    private fun meId(): String =
        tokenManager.getJwtUserId() ?: error("Not signed in")

    fun currentUserId(): String = meId()

    suspend fun getConversations(search: String? = null): Result<List<Conversation>> = runCatching {
        val me = meId()
        api.getConversations(search?.takeIf { it.isNotBlank() }).conversations.map { it.toDomain(me) }
    }

    suspend fun startConversation(participantId: String): Result<Conversation> = runCatching {
        val me = meId()
        api.startConversation(StartConversationRequestDto(participantId)).conversation.toDomain(me)
    }

    suspend fun deleteConversation(conversationId: String): Result<Unit> = runCatching {
        api.deleteConversation(conversationId)
        Unit
    }

    suspend fun getMessages(conversationId: String, search: String? = null): Result<List<Message>> = runCatching {
        api.getMessages(conversationId, search?.takeIf { it.isNotBlank() }).messages.map { it.toDomain() }
    }

    suspend fun sendMessage(conversationId: String, content: String): Result<Message> = runCatching {
        api.sendMessage(conversationId, SendMessageRequestDto(content)).message.toDomain()
    }

    private fun ConversationJsonDto.toDomain(meId: String): Conversation {
        val other = participants.firstOrNull { it.id != meId } ?: participants.firstOrNull()
            ?: return Conversation(
                id = id,
                participantName = "Unknown",
                participantAvatar = null,
                participantId = "",
                lastMessage = lastMessage?.content ?: "",
                lastMessageAt = lastMessage?.sentAt ?: "",
                unreadCount = 0
            )
        val name = when {
            other.firstName.isNotBlank() || other.lastName.isNotBlank() ->
                "${other.firstName} ${other.lastName}".trim()
            else -> other.username ?: "Unknown"
        }
        val unread = unreadCounts.firstOrNull { it.userId == meId }?.count ?: 0
        return Conversation(
            id = id,
            participantName = name,
            participantAvatar = other.avatarUrl,
            participantId = other.id,
            lastMessage = lastMessage?.content ?: "",
            lastMessageAt = lastMessage?.sentAt ?: "",
            unreadCount = unread
        )
    }

    private fun MessageJsonDto.toDomain(): Message {
        val s = senderId
        val senderName = when {
            s == null -> "Someone"
            s.firstName.isNotBlank() || s.lastName.isNotBlank() ->
                "${s.firstName} ${s.lastName}".trim()
            else -> s.username ?: "Someone"
        }
        val sid = s?.id ?: ""
        return Message(
            id = id,
            conversationId = conversationId,
            senderId = sid,
            senderName = senderName,
            content = content,
            createdAt = createdAt
        )
    }
}
