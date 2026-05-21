package com.continuum.android.feature.notifications.domain

data class Notification(
    val id: String,
    val type: String,
    val actorId: String,
    val actorName: String,
    val actorAvatarUrl: String?,
    val actorRoles: List<String>,
    val targetId: String,
    val targetType: String,
    val message: String,
    val commentPreview: String?,
    val read: Boolean,
    val readAt: String?,
    val createdAt: String
)
