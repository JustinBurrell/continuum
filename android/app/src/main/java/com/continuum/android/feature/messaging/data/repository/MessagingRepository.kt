package com.continuum.android.feature.messaging.data.repository

import com.continuum.android.feature.messaging.data.remote.MessagingApiService
import com.continuum.android.feature.messaging.data.remote.dto.*
import com.continuum.android.feature.messaging.domain.Conversation
import com.continuum.android.feature.messaging.domain.Message
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MessagingRepository @Inject constructor(private val api: MessagingApiService) {

    suspend fun getConversations(): Result<List<Conversation>> = runCatching {
        api.getConversations().data.map { it.toDomain() }
    }

    suspend fun getMessages(conversationId: String): Result<List<Message>> = runCatching {
        api.getMessages(conversationId).data.map { it.toDomain() }
    }

    suspend fun sendMessage(conversationId: String, content: String): Result<Message> = runCatching {
        api.sendMessage(conversationId, SendMessageRequestDto(content)).data.toDomain()
    }

    // Mappers
    private fun ConversationDto.toDomain() = Conversation(
        id, participantName, participantAvatar, participantId, lastMessage, lastMessageAt, unreadCount
    )
    private fun MessageDto.toDomain() = Message(id, conversationId, senderId, senderName, content, createdAt)
}
