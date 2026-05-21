package com.continuum.android.feature.notifications

import com.continuum.android.feature.notifications.domain.Notification
import com.continuum.android.feature.notifications.presentation.resolveNav
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ResolveNavTest {

    private fun notification(
        type: String,
        targetId: String = "target1",
        targetType: String = "note",
        actorId: String = "actor1",
        commentId: String? = null,
        resourceId: String? = null,
        resourceType: String? = null
    ) = Notification(
        id = "n1",
        type = type,
        actorId = actorId,
        actorName = "Jane Doe",
        actorAvatarUrl = null,
        actorRoles = emptyList(),
        targetId = targetId,
        targetType = targetType,
        message = "notification message",
        commentPreview = null,
        messagePreview = null,
        commentId = commentId,
        resourceId = resourceId,
        resourceType = resourceType,
        read = false,
        readAt = null,
        createdAt = "2026-05-20T10:00:00.000Z"
    )

    @Test
    fun `new_message routes to conversation detail`() {
        val notif = notification(type = "new_message", targetId = "conv1", targetType = "conversation")
        val route = resolveNav(notif)
        assertTrue("Expected conversation route, got: $route", route.contains("conv1"))
    }

    @Test
    fun `friend_request routes to actor user profile`() {
        val notif = notification(type = "friend_request", actorId = "user42")
        val route = resolveNav(notif)
        assertTrue("Expected user profile route, got: $route", route.contains("user42"))
    }

    @Test
    fun `friend_accepted routes to actor user profile`() {
        val notif = notification(type = "friend_accepted", actorId = "user42")
        val route = resolveNav(notif)
        assertTrue(route.contains("user42"))
    }

    @Test
    fun `task_assigned routes to task detail`() {
        val notif = notification(type = "task_assigned", targetId = "task1", targetType = "task")
        val route = resolveNav(notif)
        assertTrue(route.contains("task1"))
    }

    @Test
    fun `comment_added on note routes to note detail with commentId`() {
        val notif = notification(
            type = "comment_added",
            targetId = "note1",
            targetType = "note",
            commentId = "c1"
        )
        val route = resolveNav(notif)
        assertTrue("Expected note route with commentId, got: $route",
            route.contains("note1") && route.contains("c1"))
    }

    @Test
    fun `comment_added on flashcardSet routes to flashcard set with commentId`() {
        val notif = notification(
            type = "comment_added",
            targetId = "set1",
            targetType = "flashcardSet",
            commentId = "c2"
        )
        val route = resolveNav(notif)
        assertTrue(route.contains("set1") && route.contains("c2"))
    }

    @Test
    fun `comment_reply routes to resource via resourceId and resourceType`() {
        val notif = notification(
            type = "comment_reply",
            targetId = "parentComment1",
            targetType = "comment",
            commentId = "c3",
            resourceId = "note2",
            resourceType = "note"
        )
        val route = resolveNav(notif)
        assertTrue("Expected note2 route with comment, got: $route",
            route.contains("note2") && route.contains("c3"))
    }

    @Test
    fun `comment_reply with no resourceId returns empty`() {
        val notif = notification(
            type = "comment_reply",
            targetType = "comment",
            commentId = "c3",
            resourceId = null,
            resourceType = "note"
        )
        assertEquals("", resolveNav(notif))
    }

    @Test
    fun `like_added routes to resource with commentId for scroll`() {
        val notif = notification(
            type = "like_added",
            targetId = "commentAbc",
            targetType = "comment",
            commentId = "commentAbc",
            resourceId = "note3",
            resourceType = "note"
        )
        val route = resolveNav(notif)
        assertTrue("Expected note3 route with commentId, got: $route",
            route.contains("note3") && route.contains("commentAbc"))
    }

    @Test
    fun `like_added with no resourceId returns empty`() {
        val notif = notification(
            type = "like_added",
            targetType = "comment",
            resourceId = null,
            resourceType = "note"
        )
        assertEquals("", resolveNav(notif))
    }

    @Test
    fun `share_received on note routes to shared note view`() {
        val notif = notification(type = "share_received", targetId = "note5", targetType = "note")
        val route = resolveNav(notif)
        assertTrue(route.contains("note5"))
    }

    @Test
    fun `unknown type returns empty string`() {
        val notif = notification(type = "unknown_type")
        assertEquals("", resolveNav(notif))
    }
}
