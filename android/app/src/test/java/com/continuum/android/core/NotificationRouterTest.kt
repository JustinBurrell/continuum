package com.continuum.android.core

import com.continuum.android.core.notification.NotificationRouter
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

class NotificationRouterTest {

    private lateinit var router: NotificationRouter

    @Before
    fun setUp() {
        router = NotificationRouter()
    }

    @Test
    fun `storePendingFromFcmData stores resolved route for valid data`() {
        router.storePendingFromFcmData(mapOf("type" to "task_assigned", "targetId" to "task123"))
        assertEquals("tasks/detail/task123", router.consumePendingRoute())
    }

    @Test
    fun `consumePendingRoute returns null on second call`() {
        router.storePendingFromFcmData(mapOf("type" to "task_assigned", "targetId" to "task42"))
        router.consumePendingRoute()
        assertNull(router.consumePendingRoute())
    }

    @Test
    fun `storePendingFromFcmData stores nothing when type is missing`() {
        router.storePendingFromFcmData(emptyMap())
        assertNull(router.consumePendingRoute())
    }

    @Test
    fun `storePendingFromFcmData stores nothing when type resolves to blank route`() {
        // "comment_added" with unrecognised targetType resolves to ""
        router.storePendingFromFcmData(mapOf("type" to "comment_added", "targetType" to "unknown"))
        assertNull(router.consumePendingRoute())
    }

    @Test
    fun `consumePendingRoute returns null when nothing was stored`() {
        assertNull(router.consumePendingRoute())
    }
}
