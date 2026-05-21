package com.continuum.android.feature.notifications.data.remote.dto

import com.continuum.android.feature.notifications.domain.Notification
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class NotificationActorDto(
    @Json(name = "_id") val id: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val avatarUrl: String? = null,
    val roles: List<String> = emptyList()
)

@JsonClass(generateAdapter = true)
data class NotificationMetadataDto(
    val commentPreview: String? = null
)

@JsonClass(generateAdapter = true)
data class NotificationDto(
    @Json(name = "_id") val id: String = "",
    val type: String = "",
    val actorId: NotificationActorDto? = null,
    val targetId: String = "",
    val targetType: String = "",
    val message: String = "",
    val metadata: NotificationMetadataDto? = null,
    val read: Boolean = false,
    val readAt: String? = null,
    val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class NotificationsResponseDto(
    val success: Boolean = false,
    val notifications: List<NotificationDto> = emptyList(),
    val nextCursor: String? = null,
    val hasMore: Boolean = false,
    val unreadCount: Int = 0
)

fun NotificationDto.toDomain(): Notification {
    val actor = actorId
    val actorName = if (actor != null) "${actor.firstName} ${actor.lastName}".trim() else "Someone"
    return Notification(
        id = id,
        type = type,
        actorId = actor?.id ?: "",
        actorName = actorName,
        actorAvatarUrl = actor?.avatarUrl,
        actorRoles = actor?.roles ?: emptyList(),
        targetId = targetId,
        targetType = targetType,
        message = message,
        commentPreview = metadata?.commentPreview,
        read = read,
        readAt = readAt,
        createdAt = createdAt
    )
}
