package com.continuum.android.feature.flashcards

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.FlashcardDao
import com.continuum.android.core.data.local.FlashcardSetDao
import com.continuum.android.core.data.local.FlashcardSetEntity
import com.continuum.android.feature.flashcards.data.remote.FlashcardsApiService
import com.continuum.android.feature.flashcards.data.remote.dto.FlashcardSetDto
import com.continuum.android.feature.flashcards.data.remote.dto.FlashcardSetsResponseDto
import com.continuum.android.feature.flashcards.data.remote.dto.FlashcardSetResponseDto
import com.continuum.android.feature.flashcards.data.repository.FlashcardsRepository
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

class FlashcardsRepositoryTest {

    private val api: FlashcardsApiService = mockk()
    private val db: AppDatabase = mockk()
    private val setDao: FlashcardSetDao = mockk(relaxed = true)
    private val cardDao: FlashcardDao = mockk(relaxed = true)
    private lateinit var repository: FlashcardsRepository

    private fun fakeSetDto(id: String = "s1", title: String = "Biology") = FlashcardSetDto(
        id = id, title = title, description = "desc",
        cardCount = 2, flashcards = null,
        isAIGenerated = false, updatedAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakeSetEntity(id: String = "s1", title: String = "Biology") = FlashcardSetEntity(
        id = id, title = title, description = "desc", cardCount = 2,
        updatedAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakePage(sets: List<FlashcardSetDto> = emptyList()) = FlashcardSetsResponseDto(
        success = true, sets = sets, pagination = null
    )

    @Before
    fun setUp() {
        every { db.flashcardSetDao() } returns setDao
        every { db.flashcardDao() } returns cardDao
        repository = FlashcardsRepository(api, db)
    }

    @Test
    fun `getCachedSets — returns mapped domain sets from Room`() = runTest {
        coEvery { setDao.getAll() } returns listOf(fakeSetEntity("s1"), fakeSetEntity("s2"))

        val result = repository.getCachedSets()

        assertEquals(2, result.size)
        assertEquals("s1", result.first().id)
    }

    @Test
    fun `getSets flow — emits cache first then fresh data`() = runTest {
        coEvery { setDao.getAll() } returns listOf(fakeSetEntity("s1")) andThen listOf(fakeSetEntity("s2"))
        coEvery { api.getSets(any(), any(), any()) } returns fakePage(listOf(fakeSetDto("s2")))

        val emissions = repository.getSets().toList()

        assertTrue(emissions.isNotEmpty())
        assertTrue(emissions.first().isSuccess)
    }

    @Test
    fun `getSets flow — emits failure when cache empty and network fails`() = runTest {
        coEvery { setDao.getAll() } returns emptyList()
        coEvery { api.getSets(any(), any(), any()) } throws RuntimeException("Offline")

        val emissions = repository.getSets().toList()

        assertTrue(emissions.first().isFailure)
        assertEquals("Offline", emissions.first().exceptionOrNull()?.message)
    }

    @Test
    fun `createSet success — inserts into Room and returns domain set`() = runTest {
        val dto = fakeSetDto("s3", "Chemistry")
        coEvery { api.createSet(any()) } returns FlashcardSetResponseDto(success = true, set = dto)

        val result = repository.createSet("Chemistry", "desc")

        assertTrue(result.isSuccess)
        assertEquals("Chemistry", result.getOrNull()?.title)
        coVerify { setDao.insert(any()) }
    }

    @Test
    fun `createSet failure — returns failure`() = runTest {
        coEvery { api.createSet(any()) } throws RuntimeException("Invalid title")

        val result = repository.createSet("", "")

        assertTrue(result.isFailure)
    }

    @Test
    fun `deleteSet success — removes set and cards from Room`() = runTest {
        coEvery { api.deleteSet("s1") } returns mockk(relaxed = true)

        val result = repository.deleteSet("s1")

        assertTrue(result.isSuccess)
        coVerify { setDao.deleteById("s1") }
        coVerify { cardDao.deleteBySetId("s1") }
    }

    @Test
    fun `querySets shared path — calls getSharedSets`() = runTest {
        coEvery { api.getSharedSets(any()) } returns fakePage(listOf(fakeSetDto("shared1")))

        val result = repository.querySets(shared = true)

        assertTrue(result.isSuccess)
        assertEquals("shared1", result.getOrNull()?.first()?.id)
    }

    @Test
    fun `getStreak — returns streak count`() = runTest {
        coEvery { api.getStreak() } returns mockk { every { streak } returns 7 }

        val result = repository.getStreak()

        assertTrue(result.isSuccess)
        assertEquals(7, result.getOrNull())
    }

    @Test
    fun `updateSet success — inserts updated set into Room`() = runTest {
        val dto = fakeSetDto("s1", "Updated Biology")
        coEvery { api.updateSet("s1", any()) } returns FlashcardSetResponseDto(success = true, set = dto)

        val result = repository.updateSet("s1", "Updated Biology", null, null)

        assertTrue(result.isSuccess)
        assertEquals("Updated Biology", result.getOrNull()?.title)
        coVerify { setDao.insert(any()) }
    }

    @Test
    fun `duplicateSet success — inserts copy into Room`() = runTest {
        val dto = fakeSetDto("s2", "Biology (copy)")
        coEvery { api.duplicateSet("s1") } returns FlashcardSetResponseDto(success = true, set = dto)

        val result = repository.duplicateSet("s1")

        assertTrue(result.isSuccess)
        coVerify { setDao.insert(any()) }
    }
}
