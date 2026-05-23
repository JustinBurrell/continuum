package com.continuum.android.core

import app.cash.turbine.test
import com.continuum.android.core.notification.InAppNotification
import com.continuum.android.core.notification.InAppNotificationController
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class InAppNotificationControllerTest {

    private lateinit var controller: InAppNotificationController

    private fun data(
        type: String,
        targetId: String = "res1",
        resourceId: String = "",
        actorName: String = "Alex Chen",
        body: String = "Check this out",
    ) = mapOf(
        "type"       to type,
        "targetId"   to targetId,
        "resourceId" to resourceId,
        "actorName"  to actorName,
        "body"       to body,
    )

    @Before
    fun setUp() {
        controller = InAppNotificationController()
    }

    // ─── backgrounded: always returns true (service shows system notification) ──

    @Test
    fun `handle returns true when app is backgrounded`() {
        controller.isForegrounded = false
        val result = controller.handle(data("new_message"))
        assertTrue(result)
    }

    @Test
    fun `handle returns true for all types when backgrounded`() {
        controller.isForegrounded = false
        listOf("comment_added", "like_added", "friend_request", "task_assigned", "share_received")
            .forEach { type ->
                assertTrue("Expected true for $type", controller.handle(data(type)))
            }
    }

    // ─── foregrounded, same screen: suppress ──────────────────────────────────

    @Test
    fun `handle returns false and emits no banner when on target screen`() = runTest {
        controller.isForegrounded = true
        controller.updateCurrentRoute("social/conversations/conv1")

        controller.banner.test {
            val result = controller.handle(data("new_message", targetId = "conv1"))
            assertTrue(!result) // false = handled in-app
            expectNoEvents()
            cancel()
        }
    }

    @Test
    fun `handle suppresses comment notification when already on that note`() = runTest {
        controller.isForegrounded = true
        controller.updateCurrentRoute("notes/detail/note99")

        controller.banner.test {
            controller.handle(data("comment_added", targetId = "note99"))
            expectNoEvents()
            cancel()
        }
    }

    @Test
    fun `handle suppresses comment_reply when already on the resource screen`() = runTest {
        controller.isForegrounded = true
        controller.updateCurrentRoute("notes/detail/note5")

        controller.banner.test {
            // comment_reply uses resourceId as primary ID
            controller.handle(data("comment_reply", resourceId = "note5"))
            expectNoEvents()
            cancel()
        }
    }

    // ─── foregrounded, different screen: emit banner ──────────────────────────

    @Test
    fun `handle emits banner when foregrounded on a different screen`() = runTest {
        controller.isForegrounded = true
        controller.updateCurrentRoute("notes/list")

        controller.banner.test {
            controller.handle(data("new_message", targetId = "conv1", actorName = "Alex Chen", body = "Hey!"))
            val banner: InAppNotification = awaitItem()
            assertEquals("Alex Chen", banner.actorName)
            assertEquals("Hey!", banner.body)
            assertEquals("new_message", banner.type)
            cancel()
        }
    }

    @Test
    fun `handle emits banner for comment_added when on a different note`() = runTest {
        controller.isForegrounded = true
        controller.updateCurrentRoute("notes/detail/note1")

        controller.banner.test {
            controller.handle(data("comment_added", targetId = "note2", body = "Nice work!"))
            val banner: InAppNotification = awaitItem()
            assertEquals("comment_added", banner.type)
            assertEquals("Nice work!", banner.body)
            cancel()
        }
    }

    @Test
    fun `handle emits banner for like_added using resourceId`() = runTest {
        controller.isForegrounded = true
        controller.updateCurrentRoute("dashboard/home")

        controller.banner.test {
            controller.handle(data("like_added", resourceId = "note3"))
            awaitItem() // banner was emitted
            cancel()
        }
    }

    @Test
    fun `handle returns false when foregrounded regardless of banner emission`() = runTest {
        controller.isForegrounded = true
        controller.updateCurrentRoute("dashboard/home")

        val result = controller.handle(data("friend_request", targetId = "user9"))
        assertTrue(!result)
    }

    // ─── updateCurrentRoute ───────────────────────────────────────────────────

    @Test
    fun `updateCurrentRoute updates currentRoute StateFlow`() {
        controller.updateCurrentRoute("notes/detail/note42")
        assertEquals("notes/detail/note42", controller.currentRoute.value)
    }

    @Test
    fun `updateCurrentRoute empty string clears route`() {
        controller.updateCurrentRoute("some/route")
        controller.updateCurrentRoute("")
        assertEquals("", controller.currentRoute.value)
    }

    // ─── missing type ─────────────────────────────────────────────────────────

    @Test
    fun `handle returns false and emits nothing for missing type`() = runTest {
        controller.isForegrounded = true
        controller.banner.test {
            val result = controller.handle(emptyMap())
            assertTrue(!result)
            expectNoEvents()
            cancel()
        }
    }
}
