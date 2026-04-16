package com.continuum.android.feature.messaging.data.repository

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.ConversationEntity
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.messaging.data.remote.MessagingApiService
import com.continuum.android.feature.messaging.data.remote.dto.*
import com.continuum.android.feature.messaging.domain.Conversation
import com.continuum.android.feature.messaging.domain.Message
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MessagingRepository @Inject constructor(
    private val api: MessagingApiService,
    private val tokenManager: TokenManager,
    private val db: AppDatabase
) {
    private val conversationDao get() = db.conversationDao()

    private fun meId(): String =
        tokenManager.getJwtUserId() ?: error("Not signed in")

    fun currentUserId(): String = meId()

    /** Cache-first: emit Room immediately, then refresh from API. Only used for unfiltered load. */
    fun getConversationsFlow(): Flow<Result<List<Conversation>>> = flow {
        val me = meId()
        val cached = conversationDao.getAll().map { it.toDomain() }
        if (cached.isNotEmpty()) emit(Result.success(cached))
        try {
            val fresh = api.getConversations(null).conversations.map { it.toDomain(me) }
            conversationDao.deleteAll()
            conversationDao.insertAll(fresh.map { it.toEntity() })
            emit(Result.success(fresh))
        } catch (e: IOException) {
            if (cached.isEmpty()) emit(Result.failure(e))
        } catch (e: Exception) {
            if (cached.isEmpty()) emit(Result.failure(e))
        }
    }

    suspend fun getConversations(search: String? = null): Result<List<Conversation>> = runCatching {
        val me = meId()
        val result = api.getConversations(search?.takeIf { it.isNotBlank() }).conversations.map { it.toDomain(me) }
        if (search.isNullOrBlank()) {
            conversationDao.deleteAll()
            conversationDao.insertAll(result.map { it.toEntity() })
        }
        result
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

    private fun Conversation.toEntity() = ConversationEntity(
        id = id,
        participantId = participantId,
        participantName = participantName,
        participantAvatar = participantAvatar,
        participantRoles = participantRoles.joinToString(","),
        lastMessage = lastMessage,
        lastMessageAt = lastMessageAt,
        unreadCount = unreadCount
    )

    private fun ConversationEntity.toDomain() = Conversation(
        id = id,
        participantId = participantId,
        participantName = participantName,
        participantAvatar = participantAvatar,
        participantRoles = participantRoles.split(",").filter { it.isNotBlank() },
        lastMessage = lastMessage,
        lastMessageAt = lastMessageAt,
        unreadCount = unreadCount
    )

    private fun ConversationJsonDto.toDomain(meId: String): Conversation {
        val other = participants.firstOrNull { it.id != meId } ?: participants.firstOrNull()
            ?: return Conversation(
                id = id,
                participantName = "Unknown",
                participantAvatar = null,
                participantId = "",
                participantRoles = emptyList(),
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
            participantRoles = other.roles,
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
            senderRoles = s?.roles ?: emptyList(),
            content = content,
            createdAt = createdAt
        )
    }
}
