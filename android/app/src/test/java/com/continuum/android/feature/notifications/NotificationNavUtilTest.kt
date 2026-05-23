package com.continuum.android.feature.notifications

import com.continuum.android.core.ui.navigation.resolveNavFromFcm
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Tests resolveNavFromFcm() for every FCM notification type.
 * Pure JVM — no Android dependencies.
 */
class NotificationNavUtilTest {

    private fun data(
        type: String,
        targetId: String = "target1",
        targetType: String = "",
        actorId: String = "actor1",
        actorName: String = "Alex Chen",
        commentId: String = "",
        resourceId: String = "",
        resourceType: String = "",
    ) = mapOf(
        "type"         to type,
        "targetId"     to targetId,
        "targetType"   to targetType,
        "actorId"      to actorId,
        "actorName"    to actorName,
        "commentId"    to commentId,
        "resourceId"   to resourceId,
        "resourceType" to resourceType,
    )

    // ─── new_message ──────────────────────────────────────────────────────────

    @Test
    fun `new_message routes to conversation detail with actorName and actorId`() {
        val route = resolveNavFromFcm(data(
            type = "new_message", targetId = "conv1",
            actorName = "Alex Chen", actorId = "user42"
        ))
        assertTrue("Expected conv1 in route, got: $route", route.contains("conv1"))
        assertTrue("Expected Alex Chen encoded in route, got: $route", route.contains("Alex"))
        assertTrue("Expected actorId in route, got: $route", route.contains("user42"))
    }

    // ─── share_received ───────────────────────────────────────────────────────

    @Test
    fun `share_received on note routes to shared note`() {
        val route = resolveNavFromFcm(data(type = "share_received", targetId = "note5", targetType = "note"))
        assertTrue("Expected note5 in route, got: $route", route.contains("note5"))
    }

    @Test
    fun `share_received on flashcardSet routes to set detail`() {
        val route = resolveNavFromFcm(data(type = "share_received", targetId = "set1", targetType = "flashcardSet"))
        assertTrue(route.contains("set1"))
    }

    // ─── task_assigned ────────────────────────────────────────────────────────

    @Test
    fun `task_assigned routes to task detail`() {
        val route = resolveNavFromFcm(data(type = "task_assigned", targetId = "task1"))
        assertTrue("Expected task1 in route, got: $route", route.contains("task1"))
    }

    // ─── comment_added ────────────────────────────────────────────────────────

    @Test
    fun `comment_added on note routes to note detail with commentId`() {
        val route = resolveNavFromFcm(data(
            type = "comment_added", targetId = "note1", targetType = "note", commentId = "cmt1"
        ))
        assertTrue("Expected note1 + cmt1 in route, got: $route",
            route.contains("note1") && route.contains("cmt1"))
    }

    @Test
    fun `comment_added on flashcardSet routes to set detail with commentId`() {
        val route = resolveNavFromFcm(data(
            type = "comment_added", targetId = "set1", targetType = "flashcardSet", commentId = "cmt2"
        ))
        assertTrue(route.contains("set1") && route.contains("cmt2"))
    }

    // ─── comment_reply ────────────────────────────────────────────────────────

    @Test
    fun `comment_reply routes to note via resourceId with commentId`() {
        val route = resolveNavFromFcm(data(
            type = "comment_reply", commentId = "cmt3", resourceId = "note2", resourceType = "note"
        ))
        assertTrue("Expected note2 + cmt3, got: $route",
            route.contains("note2") && route.contains("cmt3"))
    }

    @Test
    fun `comment_reply with no resourceId returns empty`() {
        val route = resolveNavFromFcm(data(type = "comment_reply", resourceId = ""))
        assertEquals("", route)
    }

    // ─── like_added ───────────────────────────────────────────────────────────

    @Test
    fun `like_added routes to note resource with commentId`() {
        val route = resolveNavFromFcm(data(
            type = "like_added", commentId = "cmt4", resourceId = "note3", resourceType = "note"
        ))
        assertTrue("Expected note3 + cmt4, got: $route",
            route.contains("note3") && route.contains("cmt4"))
    }

    @Test
    fun `like_added with no resourceId returns empty`() {
        val route = resolveNavFromFcm(data(type = "like_added", resourceId = ""))
        assertEquals("", route)
    }

    // ─── mention ──────────────────────────────────────────────────────────────

    @Test
    fun `mention routes to note via resourceId with commentId`() {
        val route = resolveNavFromFcm(data(
            type = "mention", commentId = "cmt5", resourceId = "note4", resourceType = "note"
        ))
        assertTrue(route.contains("note4") && route.contains("cmt5"))
    }

    @Test
    fun `mention on task routes to task detail`() {
        val route = resolveNavFromFcm(data(
            type = "mention", resourceId = "task1", resourceType = "task"
        ))
        assertTrue(route.contains("task1"))
    }

    // ─── friend_request / friend_accepted ─────────────────────────────────────

    @Test
    fun `friend_request routes to actor user profile`() {
        val route = resolveNavFromFcm(data(type = "friend_request", actorId = "user99"))
        assertTrue("Expected user99 in route, got: $route", route.contains("user99"))
    }

    @Test
    fun `friend_accepted routes to actor user profile`() {
        val route = resolveNavFromFcm(data(type = "friend_accepted", actorId = "user99"))
        assertTrue(route.contains("user99"))
    }

    // ─── edge cases ───────────────────────────────────────────────────────────

    @Test
    fun `missing type returns empty`() {
        val route = resolveNavFromFcm(emptyMap())
        assertEquals("", route)
    }

    @Test
    fun `unknown type returns empty`() {
        val route = resolveNavFromFcm(data(type = "some_future_type"))
        assertEquals("", route)
    }
}
