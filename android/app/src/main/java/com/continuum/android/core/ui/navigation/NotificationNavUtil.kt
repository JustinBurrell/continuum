package com.continuum.android.core.ui.navigation

import com.continuum.android.feature.notifications.domain.Notification

fun resolveNav(notification: Notification): String {
    val targetId = notification.targetId
    val targetType = notification.targetType
    val actorId = notification.actorId
    return when (notification.type) {
        "new_message" -> NavRoutes.Social.conversationDetail(targetId)
        "share_received" -> when (targetType) {
            "note" -> NavRoutes.Social.sharedNote(targetId)
            "flashcardSet" -> NavRoutes.Flashcards.setDetail(targetId)
            else -> ""
        }
        "task_assigned" -> NavRoutes.Tasks.detail(targetId)
        "comment_added" -> when (targetType) {
            "note" -> NavRoutes.Notes.detail(targetId, commentId = notification.commentId)
            "flashcardSet" -> NavRoutes.Flashcards.setDetail(targetId, commentId = notification.commentId)
            else -> ""
        }
        "comment_reply" -> {
            val resourceId = notification.resourceId ?: return ""
            when (notification.resourceType) {
                "note" -> NavRoutes.Notes.detail(resourceId, commentId = notification.commentId)
                "flashcardSet" -> NavRoutes.Flashcards.setDetail(resourceId, commentId = notification.commentId)
                else -> ""
            }
        }
        "like_added" -> {
            val resourceId = notification.resourceId ?: return ""
            when (notification.resourceType) {
                "note" -> NavRoutes.Notes.detail(resourceId, commentId = notification.commentId)
                "flashcardSet" -> NavRoutes.Flashcards.setDetail(resourceId, commentId = notification.commentId)
                else -> ""
            }
        }
        "mention" -> {
            val resourceId = notification.resourceId ?: return ""
            when (notification.resourceType) {
                "note" -> NavRoutes.Notes.detail(resourceId, commentId = notification.commentId)
                "flashcardSet" -> NavRoutes.Flashcards.setDetail(resourceId, commentId = notification.commentId)
                "task" -> NavRoutes.Tasks.detail(resourceId)
                else -> ""
            }
        }
        "friend_request", "friend_accepted" -> NavRoutes.Social.userProfile(actorId)
        else -> ""
    }
}

fun resolveNavFromFcm(data: Map<String, String>): String {
    val type = data["type"] ?: return ""
    val targetId = data["targetId"] ?: ""
    val targetType = data["targetType"] ?: ""
    val actorId = data["actorId"] ?: ""
    val actorName = data["actorName"] ?: ""
    val commentId = data["commentId"]?.takeIf { it.isNotBlank() }
    val resourceId = data["resourceId"]?.takeIf { it.isNotBlank() }
    val resourceType = data["resourceType"]?.takeIf { it.isNotBlank() }

    return when (type) {
        "new_message" -> NavRoutes.Social.conversationDetail(
            conversationId = targetId,
            participantName = actorName,
            participantId = actorId,
        )
        "share_received" -> when (targetType) {
            "note" -> NavRoutes.Social.sharedNote(targetId)
            "flashcardSet" -> NavRoutes.Flashcards.setDetail(targetId)
            else -> ""
        }
        "task_assigned" -> NavRoutes.Tasks.detail(targetId)
        "comment_added" -> when (targetType) {
            "note" -> NavRoutes.Notes.detail(targetId, commentId = commentId)
            "flashcardSet" -> NavRoutes.Flashcards.setDetail(targetId, commentId = commentId)
            else -> ""
        }
        "comment_reply", "like_added", "mention" -> {
            val rid = resourceId ?: return ""
            when (resourceType) {
                "note" -> NavRoutes.Notes.detail(rid, commentId = commentId)
                "flashcardSet" -> NavRoutes.Flashcards.setDetail(rid, commentId = commentId)
                "task" -> NavRoutes.Tasks.detail(rid)
                else -> ""
            }
        }
        "friend_request", "friend_accepted" -> NavRoutes.Social.userProfile(actorId)
        else -> ""
    }
}
