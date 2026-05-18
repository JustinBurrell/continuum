package com.continuum.android.feature.messaging

import com.continuum.android.core.network.SocketManager
import com.continuum.android.feature.messaging.data.repository.MessagingRepository
import com.continuum.android.feature.messaging.domain.Conversation
import com.continuum.android.feature.messaging.domain.Message
import com.continuum.android.feature.messaging.presentation.MessagingViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.flowOf
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
class MessagingViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: MessagingRepository = mockk()
    private val socketManager: SocketManager = mockk()
    private val socketFlow = MutableSharedFlow<String>()
    private lateinit var viewModel: MessagingViewModel

    private fun fakeConversation(id: String = "c1", name: String = "Alice") = Conversation(
        id = id, participantId = "u2", participantName = name, participantAvatar = null,
        participantRoles = emptyList(), lastMessage = "Hey", lastMessageAt = "2025-01-01T00:00:00.000Z",
        unreadCount = 0
    )

    private fun fakeMessage(id: String = "m1", content: String = "Hello") = Message(
        id = id, conversationId = "c1", senderId = "u1", senderName = "Justin",
        senderRoles = emptyList(), content = content, createdAt = "2025-01-01T00:00:00.000Z"
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        every { socketManager.newMessageFlow } returns socketFlow
        every { repository.currentUserId() } returns "u1"
        viewModel = MessagingViewModel(repository, socketManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    // ─── Conversations ─────────────────────────────────────────────────────────

    @Test
    fun `loadConversations success — emits conversation list`() = runTest {
        val convos = listOf(fakeConversation("c1", "Alice"), fakeConversation("c2", "Bob"))
        every { repository.getConversationsFlow() } returns flowOf(Result.success(convos))

        viewModel.loadConversations()
        advanceUntilIdle()

        assertEquals(2, viewModel.conversationsState.value.conversations.size)
        assertFalse(viewModel.conversationsState.value.isLoading)
    }

    @Test
    fun `loadConversations failure — sets error`() = runTest {
        every { repository.getConversationsFlow() } returns flowOf(Result.failure(Exception("Offline")))

        viewModel.loadConversations()
        advanceUntilIdle()

        assertEquals("Offline", viewModel.conversationsState.value.error)
        assertFalse(viewModel.conversationsState.value.isLoading)
    }

    @Test
    fun `deleteConversation removes conversation from state`() = runTest {
        val convos = listOf(fakeConversation("c1"), fakeConversation("c2"))
        every { repository.getConversationsFlow() } returns flowOf(Result.success(convos))
        coEvery { repository.deleteConversation("c1") } returns Result.success(Unit)

        viewModel.loadConversations()
        advanceUntilIdle()
        assertEquals(2, viewModel.conversationsState.value.conversations.size)

        viewModel.deleteConversation("c1")
        advanceUntilIdle()

        assertEquals(1, viewModel.conversationsState.value.conversations.size)
        assertEquals("c2", viewModel.conversationsState.value.conversations.first().id)
    }

    @Test
    fun `startConversation calls repository and fires onCreated`() = runTest {
        val newConvo = fakeConversation("c3")
        coEvery { repository.startConversation("u5") } returns Result.success(newConvo)

        var createdId: String? = null
        viewModel.startConversation("u5") { id -> createdId = id }
        advanceUntilIdle()

        assertEquals("c3", createdId)
    }

    // ─── Messages ──────────────────────────────────────────────────────────────

    @Test
    fun `loadMessages success — emits messages list`() = runTest {
        val msgs = listOf(fakeMessage("m1", "Hi"), fakeMessage("m2", "Hello"))
        coEvery { repository.getMessages("c1", null) } returns Result.success(msgs)

        viewModel.loadMessages("c1")
        advanceUntilIdle()

        assertEquals(2, viewModel.detailState.value.messages.size)
        assertFalse(viewModel.detailState.value.isLoading)
    }

    @Test
    fun `sendMessage optimistic append then confirms on success`() = runTest {
        val confirmed = fakeMessage("m-real", "Hey there")
        coEvery { repository.sendMessage("c1", "Hey there") } returns Result.success(confirmed)
        coEvery { repository.getMessages("c1", null) } returns Result.success(emptyList())

        viewModel.loadMessages("c1")
        advanceUntilIdle()

        viewModel.sendMessage("c1", "Hey there")

        // Optimistic message appended immediately (before await)
        assertTrue(viewModel.detailState.value.messages.isNotEmpty())

        advanceUntilIdle()

        // Confirmed message replaces optimistic one
        val msgs = viewModel.detailState.value.messages
        assertTrue(msgs.any { it.id == "m-real" })
        assertFalse(msgs.any { it.isOptimistic == true })
        assertFalse(viewModel.detailState.value.isSending)
    }

    @Test
    fun `sendMessage failure — removes optimistic message`() = runTest {
        coEvery { repository.sendMessage("c1", "Fail msg") } returns Result.failure(Exception("Send failed"))
        coEvery { repository.getMessages("c1", null) } returns Result.success(emptyList())

        viewModel.loadMessages("c1")
        advanceUntilIdle()

        viewModel.sendMessage("c1", "Fail msg")
        advanceUntilIdle()

        assertTrue(viewModel.detailState.value.messages.isEmpty())
        assertFalse(viewModel.detailState.value.isSending)
    }

    @Test
    fun `setParticipantName updates detailState`() {
        viewModel.setParticipantName("Carol")
        assertEquals("Carol", viewModel.detailState.value.participantName)
    }

    @Test
    fun `currentUserId returns value from repository`() {
        assertEquals("u1", viewModel.currentUserId)
    }

    // ─── Search ────────────────────────────────────────────────────────────────

    @Test
    fun `setConversationSearch updates searchQuery on state`() = runTest {
        every { repository.getConversationsFlow() } returns flowOf(Result.success(emptyList()))
        coEvery { repository.getConversations(any()) } returns Result.success(emptyList())

        viewModel.setConversationSearch("ali")
        advanceUntilIdle()

        assertEquals("ali", viewModel.conversationsState.value.searchQuery)
    }
}
