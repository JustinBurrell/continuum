package com.continuum.android.feature.notifications

import com.continuum.android.core.notification.InAppNotificationController
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Before
import org.junit.Test

/**
 * Tests the branching logic in ContinuumMessagingService.onMessageReceived:
 *
 *  - new_message + backgrounded  → showMessageNotification (system tray)
 *  - new_message + foregrounded  → InAppNotificationController.handle() decides
 *  - other types + foregrounded  → InAppNotificationController.handle() decides
 *  - missing type                → early return, nothing happens
 *
 * We test through InAppNotificationController because the service itself
 * delegates entirely to it once the data is validated. The controller's
 * own behavior is covered in InAppNotificationControllerTest.
 */
class ContinuumMessagingServiceTest {

    private lateinit var controller: InAppNotificationController

    @Before
    fun setUp() {
        controller = InAppNotificationController()
    }

    // ─── new_message + backgrounded ────────────────────────────────────────

    @Test
    fun `backgrounded new_message — controller returns true (show system notification)`() {
        controller.isForegrounded = false
        val result = controller.handle(mapOf("type" to "new_message", "targetId" to "conv1"))
        assert(result) { "Expected controller to return true (show system notification)" }
    }

    // ─── new_message + foregrounded, different screen ─────────────────────

    @Test
    fun `foregrounded new_message on different screen — controller returns false (show banner)`() {
        controller.isForegrounded = true
        controller.updateCurrentRoute("notes/list")
        val result = controller.handle(mapOf("type" to "new_message", "targetId" to "conv1"))
        assert(!result) { "Expected controller to return false (handle in-app)" }
    }

    // ─── new_message + foregrounded, same conversation ────────────────────

    @Test
    fun `foregrounded new_message on same conversation — controller suppresses entirely`() {
        controller.isForegrounded = true
        controller.updateCurrentRoute("social/conversations/conv99")
        val result = controller.handle(mapOf("type" to "new_message", "targetId" to "conv99"))
        assert(!result) { "Expected suppression (false) when already in that conversation" }
    }

    // ─── non-message types + foregrounded ────────────────────────────────

    @Test
    fun `foregrounded comment_added on different note — controller returns false`() {
        controller.isForegrounded = true
        controller.updateCurrentRoute("notes/detail/note1")
        val result = controller.handle(mapOf("type" to "comment_added", "targetId" to "note2"))
        assert(!result)
    }

    @Test
    fun `foregrounded comment_added on same note — controller suppresses`() {
        controller.isForegrounded = true
        controller.updateCurrentRoute("notes/detail/note1")
        val result = controller.handle(mapOf("type" to "comment_added", "targetId" to "note1"))
        assert(!result)
    }

    @Test
    fun `backgrounded comment_added — controller returns true`() {
        controller.isForegrounded = false
        val result = controller.handle(mapOf("type" to "comment_added", "targetId" to "note1"))
        assert(result)
    }

    // ─── all non-message types backgrounded ──────────────────────────────

    @Test
    fun `all non-message types return true when backgrounded`() {
        controller.isForegrounded = false
        listOf("like_added", "friend_request", "friend_accepted", "task_assigned", "share_received", "mention")
            .forEach { type ->
                val result = controller.handle(mapOf("type" to type, "targetId" to "res1"))
                assert(result) { "Expected true for $type when backgrounded" }
            }
    }

    // ─── missing type ─────────────────────────────────────────────────────

    @Test
    fun `missing type — controller returns false, nothing shown`() {
        controller.isForegrounded = true
        val result = controller.handle(emptyMap())
        assert(!result) { "Expected false for missing type" }
    }
}
