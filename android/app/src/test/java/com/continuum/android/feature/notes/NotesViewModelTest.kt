package com.continuum.android.feature.notes

import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.feature.notes.data.repository.NotesRepository
import com.continuum.android.feature.notes.domain.Note
import com.continuum.android.feature.notes.presentation.NotesViewModel
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class NotesViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: NotesRepository = mockk()
    private val notifier = DataRefreshNotifier()
    private lateinit var viewModel: NotesViewModel

    private fun fakeNote(id: String = "n1", title: String = "Test Note") = Note(
        id = id,
        title = title,
        content = "<p>Content</p>",
        type = "general",
        tags = emptyList(),
        isFavorite = false,
        visibility = "private",
        googleDocId = null,
        hasFlashcards = false,
        quickSummary = null,
        detailedSummary = null,
        updatedAt = "2025-01-01T00:00:00.000Z",
        createdAt = "2025-01-01T00:00:00.000Z"
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = NotesViewModel(repository, notifier)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadNotes success — fast path emits notes list`() = runTest {
        val notes = listOf(fakeNote("n1", "Note 1"), fakeNote("n2", "Note 2"))
        // Fast path is used when search is blank, not shared, selectedType == "all"
        every { repository.getNotes() } returns flowOf(Result.success(notes))

        viewModel.loadNotes()
        advanceUntilIdle()

        assertEquals(notes, viewModel.listState.value.notes)
        assertNull(viewModel.listState.value.error)
    }

    @Test
    fun `loadNotes failure — fast path sets error state`() = runTest {
        every { repository.getNotes() } returns flowOf(Result.failure(Exception("Network error")))

        viewModel.loadNotes()
        advanceUntilIdle()

        assertEquals("Network error", viewModel.listState.value.error)
    }

    @Test
    fun `queryNotes (search path) populates notes list`() = runTest {
        val notes = listOf(fakeNote("n1", "Searchable Note"))
        coEvery { repository.queryNotes(search = "Searchable", type = "all", shared = false) } returns Result.success(notes)

        viewModel.setSearchQuery("Searchable")
        advanceUntilIdle()

        assertEquals(notes, viewModel.listState.value.notes)
    }

    @Test
    fun `createNote success triggers loadNotes`() = runTest {
        val newNote = fakeNote("n3", "Created Note")
        coEvery { repository.createNote("Created Note", "", emptyList(), "private") } returns Result.success(newNote)
        every { repository.getNotes() } returns flowOf(Result.success(listOf(newNote)))

        var createdId: String? = null
        viewModel.createNote("Created Note", "", emptyList(), "private") { id -> createdId = id }
        advanceUntilIdle()

        assertEquals("n3", createdId)
        coVerify { repository.createNote("Created Note", "", emptyList(), "private") }
    }

    @Test
    fun `deleteNote removes note from list`() = runTest {
        val notes = listOf(fakeNote("n1", "To Delete"), fakeNote("n2", "Keep"))
        every { repository.getNotes() } returns flowOf(Result.success(notes))
        coEvery { repository.deleteNote("n1") } returns Result.success(Unit)

        // Prime the list
        viewModel.loadNotes()
        advanceUntilIdle()
        assertEquals(2, viewModel.listState.value.notes.size)

        // After delete, the next loadNotes returns only n2
        every { repository.getNotes() } returns flowOf(Result.success(listOf(fakeNote("n2", "Keep"))))
        viewModel.deleteNote("n1")
        advanceUntilIdle()

        coVerify { repository.deleteNote("n1") }
    }

    @Test
    fun `setType updates selectedType and triggers reload`() = runTest {
        val lectureNotes = listOf(fakeNote("n1", "Lecture Note").copy(type = "lecture"))
        coEvery { repository.queryNotes(search = null, type = "lecture", shared = false) } returns Result.success(lectureNotes)

        viewModel.setType("lecture")
        advanceUntilIdle()

        assertEquals("lecture", viewModel.listState.value.selectedType)
    }
}
