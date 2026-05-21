package com.continuum.android.feature.notifications

import com.continuum.android.core.network.SocketManager
import com.continuum.android.feature.notifications.data.repository.NotificationsRepository
import com.continuum.android.feature.notifications.domain.Notification
import com.continuum.android.feature.notifications.presentation.NotificationsViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class NotificationsViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: NotificationsRepository = mockk()
    private val socketManager: SocketManager = mockk()
    private val fakeSocketFlow = MutableSharedFlow<String>(extraBufferCapacity = 32)
    private lateinit var viewModel: NotificationsViewModel

    private fun fakeNotification(
        id: String = "n1",
        read: Boolean = false,
        type: String = "comment_added"
    ) = Notification(
        id = id,
        type = type,
        actorId = "u1",
        actorName = "Jane Doe",
        actorAvatarUrl = null,
        targetId = "t1",
        targetType = "note",
        message = "Jane commented on your note",
        metadata = emptyMap(),
        read = read,
        readAt = null,
        createdAt = "2026-05-20T10:00:00.000Z"
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { socketManager.newNotificationFlow } returns fakeSocketFlow
        coEvery { repository.getNotifications(cursor = null) } returns
                Result.success(Triple(emptyList(), null, 0))
        viewModel = NotificationsViewModel(repository, socketManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadNotifications success populates items and unreadCount`() = runTest {
        val items = listOf(fakeNotification("n1"), fakeNotification("n2"))
        coEvery { repository.getNotifications(cursor = null) } returns
                Result.success(Triple(items, null, 2))

        viewModel.loadNotifications()
        advanceUntilIdle()

        assertEquals(2, viewModel.state.value.items.size)
        assertEquals(2, viewModel.state.value.unreadCount)
        assertFalse(viewModel.state.value.isLoading)
    }

    @Test
    fun `loadNotifications failure leaves items empty`() = runTest {
        coEvery { repository.getNotifications(cursor = null) } returns
                Result.failure(Exception("Network error"))

        viewModel.loadNotifications()
        advanceUntilIdle()

        assertTrue(viewModel.state.value.items.isEmpty())
        assertFalse(viewModel.state.value.isLoading)
    }

    @Test
    fun `loadMore appends items and advances cursor`() = runTest {
        val firstPage = listOf(fakeNotification("n1"), fakeNotification("n2"))
        val secondPage = listOf(fakeNotification("n3"))
        coEvery { repository.getNotifications(cursor = null) } returns
                Result.success(Triple(firstPage, "cursor1", 3))
        coEvery { repository.getNotifications(cursor = "cursor1") } returns
                Result.success(Triple(secondPage, null, 3))

        viewModel.loadNotifications()
        advanceUntilIdle()
        viewModel.loadMore()
        advanceUntilIdle()

        assertEquals(3, viewModel.state.value.items.size)
        assertEquals(null, viewModel.state.value.nextCursor)
    }

    @Test
    fun `markAllRead sets unreadCount to zero and marks all items read`() = runTest {
        val items = listOf(fakeNotification("n1", read = false), fakeNotification("n2", read = false))
        coEvery { repository.getNotifications(cursor = null) } returns
                Result.success(Triple(items, null, 2))
        coEvery { repository.markAllRead() } returns Result.success(Unit)

        viewModel.loadNotifications()
        advanceUntilIdle()
        viewModel.markAllRead()
        advanceUntilIdle()

        assertEquals(0, viewModel.state.value.unreadCount)
        assertTrue(viewModel.state.value.items.all { it.read })
        coVerify { repository.markAllRead() }
    }

    @Test
    fun `deleteNotification removes item and decrements unreadCount when unread`() = runTest {
        val items = listOf(fakeNotification("n1", read = false), fakeNotification("n2", read = true))
        coEvery { repository.getNotifications(cursor = null) } returns
                Result.success(Triple(items, null, 1))
        coEvery { repository.deleteNotification("n1") } returns Result.success(Unit)

        viewModel.loadNotifications()
        advanceUntilIdle()
        viewModel.deleteNotification("n1")
        advanceUntilIdle()

        assertEquals(1, viewModel.state.value.items.size)
        assertEquals("n2", viewModel.state.value.items.first().id)
        assertEquals(0, viewModel.state.value.unreadCount)
    }

    @Test
    fun `socket new_notification updates unreadCount`() = runTest {
        viewModel.loadNotifications()
        advanceUntilIdle()

        fakeSocketFlow.emit("""{"unreadCount": 5}""")
        advanceUntilIdle()

        assertEquals(5, viewModel.state.value.unreadCount)
    }
}
