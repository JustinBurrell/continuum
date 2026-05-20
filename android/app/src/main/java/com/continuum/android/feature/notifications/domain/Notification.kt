package com.continuum.android.feature.notifications.domain

data class Notification(
    val id: String,
    val type: String,
    val actorId: String,
    val actorName: String,
    val actorAvatarUrl: String?,
    val targetId: String,
    val targetType: String,
    val message: String,
    val metadata: Map<String, String>,
    val read: Boolean,
    val readAt: String?,
    val createdAt: String
)
