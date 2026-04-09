package com.continuum.android.feature.messaging.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ConversationDto(
    @Json(name = "_id") val id: String = "",
    val participantName: String = "",
    val participantAvatar: String? = null,
    val participantId: String = "",
    val lastMessage: String = "",
    val lastMessageAt: String = "",
    val unreadCount: Int = 0
)

@JsonClass(generateAdapter = true)
data class ConversationsResponseDto(
    val success: Boolean = false,
    val data: List<ConversationDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class MessageDto(
    @Json(name = "_id") val id: String = "",
    val conversationId: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val content: String = "",
    val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class MessagesResponseDto(
    val success: Boolean = false,
    val data: List<MessageDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class SendMessageRequestDto(val content: String)

@JsonClass(generateAdapter = true)
data class MessageResponseDto(
    val success: Boolean = false,
    val data: MessageDto = MessageDto()
)
