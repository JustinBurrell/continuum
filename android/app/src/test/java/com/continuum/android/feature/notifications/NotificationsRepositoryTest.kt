package com.continuum.android.feature.notifications

import com.continuum.android.feature.notifications.data.remote.NotificationsApiService
import com.continuum.android.feature.notifications.data.remote.dto.NotificationActorDto
import com.continuum.android.feature.notifications.data.remote.dto.NotificationDto
import com.continuum.android.feature.notifications.data.remote.dto.NotificationsResponseDto
import com.continuum.android.feature.notifications.data.repository.NotificationsRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody.Companion.toResponseBody
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Response

class NotificationsRepositoryTest {

    private val api: NotificationsApiService = mockk()
    private lateinit var repository: NotificationsRepository

    private fun fakeDto(id: String = "n1") = NotificationDto(
        id = id,
        type = "comment_added",
        actorId = NotificationActorDto(id = "u1", firstName = "Jane", lastName = "Doe"),
        targetId = "t1",
        targetType = "note",
        message = "Jane commented on your note",
        read = false,
        readAt = null,
        createdAt = "2026-05-20T10:00:00.000Z"
    )

    private fun fakeResponse(
        dtos: List<NotificationDto> = emptyList(),
        nextCursor: String? = null,
        unreadCount: Int = 0
    ) = NotificationsResponseDto(
        success = true,
        notifications = dtos,
        nextCursor = nextCursor,
        hasMore = nextCursor != null,
        unreadCount = unreadCount
    )

    @Before
    fun setUp() {
        repository = NotificationsRepository(api)
    }

    @Test
    fun `getNotifications returns domain list and cursor`() = runTest {
        coEvery { api.getNotifications(cursor = null, limit = 20) } returns
                fakeResponse(listOf(fakeDto("n1"), fakeDto("n2")), "cursor1", 2)

        val result = repository.getNotifications()

        assertTrue(result.isSuccess)
        val (items, cursor, unread) = result.getOrThrow()
        assertEquals(2, items.size)
        assertEquals("n1", items[0].id)
        assertEquals("Jane Doe", items[0].actorName)
        assertEquals("cursor1", cursor)
        assertEquals(2, unread)
    }

    @Test
    fun `getNotifications with cursor passes it to API`() = runTest {
        coEvery { api.getNotifications(cursor = "cursor1", limit = 20) } returns fakeResponse()

        repository.getNotifications(cursor = "cursor1")

        coVerify { api.getNotifications(cursor = "cursor1", limit = 20) }
    }

    @Test
    fun `getNotifications failure returns failure result`() = runTest {
        coEvery { api.getNotifications(any(), any()) } throws Exception("Server error")

        val result = repository.getNotifications()

        assertTrue(result.isFailure)
    }

    @Test
    fun `markAllRead calls correct API endpoint`() = runTest {
        coEvery { api.markAllRead() } returns Response.success(Unit)

        val result = repository.markAllRead()

        assertTrue(result.isSuccess)
        coVerify { api.markAllRead() }
    }

    @Test
    fun `markOneRead calls PATCH with correct id`() = runTest {
        coEvery { api.markOneRead("n1") } returns Response.success(Unit)

        val result = repository.markOneRead("n1")

        assertTrue(result.isSuccess)
        coVerify { api.markOneRead("n1") }
    }

    @Test
    fun `deleteNotification calls DELETE with correct id`() = runTest {
        coEvery { api.deleteNotification("n1") } returns Response.success(Unit)

        val result = repository.deleteNotification("n1")

        assertTrue(result.isSuccess)
        coVerify { api.deleteNotification("n1") }
    }
}
