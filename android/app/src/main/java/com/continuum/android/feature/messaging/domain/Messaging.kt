package com.continuum.android.feature.messaging.domain

data class Conversation(
    val id: String,
    val participantName: String,
    val participantAvatar: String?,
    val participantId: String,
    val lastMessage: String,
    val lastMessageAt: String,
    val unreadCount: Int
) {
    val initials: String get() = participantName.split(" ")
        .mapNotNull { it.firstOrNull()?.uppercaseChar() }
        .take(2)
        .joinToString("")
        .ifEmpty { "?" }
}

data class Message(
    val id: String,
    val conversationId: String,
    val senderId: String,
    val senderName: String,
    val content: String,
    val createdAt: String,
    val isOptimistic: Boolean = false  // true for locally-added messages before server confirmation
)
