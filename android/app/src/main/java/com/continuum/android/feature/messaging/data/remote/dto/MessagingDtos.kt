package com.continuum.android.feature.messaging.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class MessagingUserDto(
    @Json(name = "_id") val id: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val username: String? = null,
    @Json(name = "avatarUrl") val avatarUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class LastMessageDto(
    val content: String? = null,
    val sentAt: String? = null
)

@JsonClass(generateAdapter = true)
data class UnreadCountDto(
    val userId: String? = null,
    val count: Int = 0
)

@JsonClass(generateAdapter = true)
data class ConversationJsonDto(
    @Json(name = "_id") val id: String = "",
    val participants: List<MessagingUserDto> = emptyList(),
    val lastMessage: LastMessageDto? = null,
    val unreadCounts: List<UnreadCountDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ConversationsResponseDto(
    val success: Boolean = false,
    val conversations: List<ConversationJsonDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class MessageJsonDto(
    @Json(name = "_id") val id: String = "",
    val conversationId: String = "",
    val senderId: MessagingUserDto? = null,
    val content: String = "",
    val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class MessagesResponseDto(
    val success: Boolean = false,
    val messages: List<MessageJsonDto> = emptyList(),
    val hasMore: Boolean = false
)

@JsonClass(generateAdapter = true)
data class SendMessageRequestDto(val content: String)

@JsonClass(generateAdapter = true)
data class StartConversationRequestDto(val participantId: String)

@JsonClass(generateAdapter = true)
data class StartConversationResponseDto(
    val success: Boolean = false,
    val conversation: ConversationJsonDto = ConversationJsonDto()
)

@JsonClass(generateAdapter = true)
data class MessageResponseDto(
    val success: Boolean = false,
    val message: MessageJsonDto = MessageJsonDto()
)
