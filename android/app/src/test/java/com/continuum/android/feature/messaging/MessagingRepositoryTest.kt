package com.continuum.android.feature.messaging

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.ConversationDao
import com.continuum.android.core.data.local.ConversationEntity
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.messaging.data.remote.MessagingApiService
import com.continuum.android.feature.messaging.data.remote.dto.ConversationJsonDto
import com.continuum.android.feature.messaging.data.remote.dto.MessagingUserDto
import com.continuum.android.feature.messaging.data.remote.dto.ConversationsResponseDto
import com.continuum.android.feature.messaging.data.remote.dto.MessageJsonDto
import com.continuum.android.feature.messaging.data.remote.dto.MessageResponseDto
import com.continuum.android.feature.messaging.data.remote.dto.MessagesResponseDto
import com.continuum.android.feature.messaging.data.repository.MessagingRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class MessagingRepositoryTest {

    private val api: MessagingApiService = mockk()
    private val tokenManager: TokenManager = mockk(relaxed = true)
    private val db: AppDatabase = mockk()
    private val conversationDao: ConversationDao = mockk(relaxed = true)
    private lateinit var repository: MessagingRepository

    private fun fakeParticipant(id: String = "u2", first: String = "Alice") = MessagingUserDto(
        id = id, firstName = first, lastName = "Smith", username = "asmith",
        avatarUrl = null, roles = emptyList()
    )

    private fun fakeConversationDto(id: String = "c1") = ConversationJsonDto(
        id = id,
        participants = listOf(fakeParticipant("u1", "Me"), fakeParticipant("u2", "Alice")),
        lastMessage = null,
        unreadCounts = emptyList()
    )

    private fun fakeConversationEntity(id: String = "c1") = ConversationEntity(
        id = id, participantId = "u2", participantName = "Alice", participantAvatar = null,
        participantRoles = "", lastMessage = "Hey", lastMessageAt = "2025-01-01T00:00:00.000Z",
        unreadCount = 0
    )

    private fun fakeMessageDto(id: String = "m1", content: String = "Hello") = MessageJsonDto(
        id = id, conversationId = "c1", senderId = null,
        content = content, createdAt = "2025-01-01T00:00:00.000Z"
    )

    @Before
    fun setUp() {
        every { db.conversationDao() } returns conversationDao
        every { tokenManager.getJwtUserId() } returns "u1"
        repository = MessagingRepository(api, tokenManager, db)
    }

    @Test
    fun `currentUserId returns value from tokenManager`() {
        assertEquals("u1", repository.currentUserId())
    }

    @Test
    fun `getConversationsFlow — emits cache first then fresh data`() = runTest {
        coEvery { conversationDao.getAll() } returns listOf(fakeConversationEntity("c1")) andThen listOf(fakeConversationEntity("c2"))
        coEvery { api.getConversations(null) } returns ConversationsResponseDto(
            success = true,
            conversations = listOf(fakeConversationDto("c2"))
        )

        val emissions = repository.getConversationsFlow().toList()

        assertTrue(emissions.isNotEmpty())
        assertTrue(emissions.first().isSuccess)
    }

    @Test
    fun `getConversationsFlow — emits failure when cache empty and API fails`() = runTest {
        coEvery { conversationDao.getAll() } returns emptyList()
        coEvery { api.getConversations(null) } throws RuntimeException("Offline")

        val emissions = repository.getConversationsFlow().toList()

        assertTrue(emissions.first().isFailure)
    }

    @Test
    fun `getMessages success — returns mapped messages`() = runTest {
        val msgs = listOf(fakeMessageDto("m1", "Hi"), fakeMessageDto("m2", "Hello"))
        coEvery { api.getMessages("c1", null) } returns MessagesResponseDto(success = true, messages = msgs)

        val result = repository.getMessages("c1")

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
    }

    @Test
    fun `getMessages failure — returns failure`() = runTest {
        coEvery { api.getMessages(any(), any()) } throws RuntimeException("Forbidden")

        val result = repository.getMessages("c1")

        assertTrue(result.isFailure)
    }

    @Test
    fun `sendMessage success — returns confirmed message`() = runTest {
        val dto = fakeMessageDto("m-real", "Confirmed")
        coEvery { api.sendMessage("c1", any()) } returns MessageResponseDto(success = true, message = dto)

        val result = repository.sendMessage("c1", "Confirmed")

        assertTrue(result.isSuccess)
        assertEquals("m-real", result.getOrNull()?.id)
    }

    @Test
    fun `deleteConversation success — calls API`() = runTest {
        coEvery { api.deleteConversation("c1") } returns mockk(relaxed = true)

        val result = repository.deleteConversation("c1")

        assertTrue(result.isSuccess)
        coVerify { api.deleteConversation("c1") }
    }

    @Test
    fun `getConversations with search — calls API with search param`() = runTest {
        coEvery { api.getConversations("alice") } returns ConversationsResponseDto(
            success = true,
            conversations = listOf(fakeConversationDto("c1"))
        )

        val result = repository.getConversations("alice")

        assertTrue(result.isSuccess)
        assertEquals("c1", result.getOrNull()?.first()?.id)
    }
}
