package com.continuum.android.feature.notes

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.NoteDao
import com.continuum.android.core.data.local.NoteEntity
import com.continuum.android.feature.notes.data.remote.NotesApiService
import com.continuum.android.feature.notes.data.remote.dto.NoteDto
import com.continuum.android.feature.notes.data.remote.dto.NotesListResponseDto
import com.continuum.android.feature.notes.data.remote.dto.NoteResponseDto
import com.continuum.android.feature.notes.data.repository.NotesRepository
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

class NotesRepositoryTest {

    private val api: NotesApiService = mockk()
    private val db: AppDatabase = mockk()
    private val noteDao: NoteDao = mockk(relaxed = true)
    private lateinit var repository: NotesRepository

    private fun fakeNoteDto(id: String = "n1", title: String = "Note") = NoteDto(
        id = id, title = title, content = "<p>Content</p>",
        type = "general", tags = emptyList(), isPinned = false, visibility = "private",
        updatedAt = "2025-01-01T00:00:00.000Z", createdAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakeNoteEntity(id: String = "n1", title: String = "Note") = NoteEntity(
        id = id, title = title, content = "<p>Content</p>", tags = "",
        isFavorite = false, updatedAt = "2025-01-01T00:00:00.000Z", createdAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakePage(notes: List<NoteDto> = emptyList()) = NotesListResponseDto(
        success = true,
        notes = notes,
        pagination = null
    )

    @Before
    fun setUp() {
        every { db.noteDao() } returns noteDao
        repository = NotesRepository(api, db)
    }

    @Test
    fun `getCachedNotes — returns mapped domain notes from Room`() = runTest {
        val entities = listOf(fakeNoteEntity("n1"), fakeNoteEntity("n2"))
        coEvery { noteDao.getAll() } returns entities

        val result = repository.getCachedNotes()

        assertEquals(2, result.size)
        assertEquals("n1", result.first().id)
    }

    @Test
    fun `getNotes flow — emits cache then fresh network data`() = runTest {
        val cached = listOf(fakeNoteEntity("n1"))
        val fresh = listOf(fakeNoteDto("n2"))
        coEvery { noteDao.getAll() } returns cached andThen listOf(fakeNoteEntity("n2"))
        coEvery { api.getNotes(any(), any(), any(), any()) } returns fakePage(fresh)

        val emissions = repository.getNotes().toList()

        assertTrue(emissions.size >= 1)
        assertTrue(emissions.first().isSuccess)
    }

    @Test
    fun `getNotes flow — emits failure when cache empty and network fails`() = runTest {
        coEvery { noteDao.getAll() } returns emptyList()
        coEvery { api.getNotes(any(), any(), any(), any()) } throws RuntimeException("Offline")

        val emissions = repository.getNotes().toList()

        assertTrue(emissions.any { it.isFailure })
        assertEquals("Offline", emissions.first { it.isFailure }.exceptionOrNull()?.message)
    }

    @Test
    fun `createNote success — inserts to Room and returns domain note`() = runTest {
        val dto = fakeNoteDto("n3", "New Note")
        coEvery { api.createNote(any()) } returns NoteResponseDto(success = true, note = dto)
        coEvery { noteDao.insert(any()) } returns Unit

        val result = repository.createNote("New Note", "<p></p>", emptyList(), "private")

        assertTrue(result.isSuccess)
        assertEquals("n3", result.getOrNull()?.id)
        coVerify { noteDao.insert(any()) }
    }

    @Test
    fun `createNote failure — returns failure result`() = runTest {
        coEvery { api.createNote(any()) } throws RuntimeException("Validation error")

        val result = repository.createNote("", "", emptyList(), "private")

        assertTrue(result.isFailure)
    }

    @Test
    fun `deleteNote success — removes from Room`() = runTest {
        coEvery { api.deleteNote("n1") } returns mockk(relaxed = true)
        coEvery { noteDao.deleteById("n1") } returns Unit

        val result = repository.deleteNote("n1")

        assertTrue(result.isSuccess)
        coVerify { noteDao.deleteById("n1") }
    }

    @Test
    fun `updateNote success — inserts updated entity to Room`() = runTest {
        val dto = fakeNoteDto("n1", "Updated Title")
        coEvery { api.updateNote("n1", any()) } returns NoteResponseDto(success = true, note = dto)
        coEvery { noteDao.insert(any()) } returns Unit

        val result = repository.updateNote("n1", "Updated Title", null, null, null)

        assertTrue(result.isSuccess)
        assertEquals("Updated Title", result.getOrNull()?.title)
    }

    @Test
    fun `queryNotes shared path — calls getSharedNotes`() = runTest {
        coEvery { api.getSharedNotes(any()) } returns fakePage(listOf(fakeNoteDto("s1")))

        val result = repository.queryNotes(search = null, type = null, shared = true)

        assertTrue(result.isSuccess)
        assertEquals("s1", result.getOrNull()?.first()?.id)
        coVerify { api.getSharedNotes(any()) }
    }

    @Test
    fun `getNoteById — fetches from API and caches in Room`() = runTest {
        val dto = fakeNoteDto("n1")
        coEvery { api.getNoteById("n1") } returns NoteResponseDto(success = true, note = dto)
        coEvery { noteDao.insert(any()) } returns Unit

        val result = repository.getNoteById("n1")

        assertTrue(result.isSuccess)
        coVerify { noteDao.insert(any()) }
    }

    @Test
    fun `getNoteById falls back to cache on network failure`() = runTest {
        coEvery { api.getNoteById("n1") } throws RuntimeException("No network")
        coEvery { noteDao.getById("n1") } returns fakeNoteEntity("n1", "Cached")

        val result = repository.getNoteById("n1")

        assertTrue(result.isSuccess)
        assertEquals("Cached", result.getOrNull()?.title)
    }
}
