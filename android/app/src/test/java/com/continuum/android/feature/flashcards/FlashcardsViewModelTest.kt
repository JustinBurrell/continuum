package com.continuum.android.feature.flashcards

import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.feature.flashcards.data.repository.FlashcardsRepository
import com.continuum.android.feature.flashcards.domain.Flashcard
import com.continuum.android.feature.flashcards.domain.FlashcardSet
import com.continuum.android.feature.flashcards.presentation.FlashcardsViewModel
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
class FlashcardsViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: FlashcardsRepository = mockk()
    private val notifier = DataRefreshNotifier()
    private lateinit var viewModel: FlashcardsViewModel

    private fun fakeSet(id: String = "s1", title: String = "Test Set") = FlashcardSet(
        id = id,
        title = title,
        description = "",
        cardCount = 2,
        isAIGenerated = false,
        lastStudied = null,
        updatedAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakeCard(id: String = "c1", front: String = "Q?", back: String = "A!") = Flashcard(
        id = id,
        setId = "s1",
        front = front,
        back = back,
        position = 0
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = FlashcardsViewModel(repository, notifier)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadSets success emits sets list and streak`() = runTest {
        val sets = listOf(fakeSet("s1", "Biology"), fakeSet("s2", "History"))
        every { repository.getSets() } returns flowOf(Result.success(sets))
        coEvery { repository.getStreak() } returns Result.success(3)

        viewModel.loadSets()
        advanceUntilIdle()

        assertEquals(sets, viewModel.setsState.value.sets)
        assertEquals(3, viewModel.setsState.value.streak)
        assertNull(viewModel.setsState.value.error)
    }

    @Test
    fun `loadSets failure sets error state`() = runTest {
        every { repository.getSets() } returns flowOf(Result.failure(Exception("No connection")))
        coEvery { repository.getStreak() } returns Result.success(0)

        viewModel.loadSets()
        advanceUntilIdle()

        assertEquals("No connection", viewModel.setsState.value.error)
    }

    @Test
    fun `createSet success triggers reload`() = runTest {
        val newSet = fakeSet("s3", "New Set")
        coEvery { repository.createSet("New Set", "") } returns Result.success(newSet)
        every { repository.getSets() } returns flowOf(Result.success(listOf(newSet)))
        coEvery { repository.getStreak() } returns Result.success(0)

        var called = false
        viewModel.createSet("New Set", "") { called = true }
        advanceUntilIdle()

        assertTrue("onCreated called", called)
        coVerify { repository.createSet("New Set", "") }
    }

    @Test
    fun `startStudy loads cards for study mode`() = runTest {
        val cards = listOf(fakeCard("c1", "Capital of France?", "Paris"))
        coEvery { repository.getCards("s1") } returns Result.success(cards)

        viewModel.startStudy("s1")
        advanceUntilIdle()

        assertEquals(1, viewModel.studyState.value.cards.size)
        assertEquals(false, viewModel.studyState.value.isLoading)
    }

    @Test
    fun `flipCard toggles isFlipped state`() {
        assertEquals(false, viewModel.studyState.value.isFlipped)
        viewModel.flipCard()
        assertEquals(true, viewModel.studyState.value.isFlipped)
        viewModel.flipCard()
        assertEquals(false, viewModel.studyState.value.isFlipped)
    }

    @Test
    fun `answerCard correct increments correctCount and advances index`() = runTest {
        val cards = listOf(fakeCard("c1"), fakeCard("c2"))
        coEvery { repository.getCards("s1") } returns Result.success(cards)
        coEvery { repository.updateProgress("s1", "c1", true) } returns Result.success(Unit)

        viewModel.startStudy("s1")
        advanceUntilIdle()

        // Do not call submitStudySession for a single non-completing answer
        viewModel.answerCard("s1", correct = true, syncToServer = false)

        assertEquals(1, viewModel.studyState.value.correctCount)
        assertEquals(1, viewModel.studyState.value.currentIndex)
        assertEquals(false, viewModel.studyState.value.isComplete)
    }

    @Test
    fun `answerCard on last card sets isComplete`() = runTest {
        val cards = listOf(fakeCard("c1"))
        coEvery { repository.getCards("s1") } returns Result.success(cards)
        // syncToServer = false so submitStudySession is not called

        viewModel.startStudy("s1")
        advanceUntilIdle()

        viewModel.answerCard("s1", correct = true, syncToServer = false)

        assertTrue("Session should be complete", viewModel.studyState.value.isComplete)
    }

    @Test
    fun `deleteSet triggers loadSets`() = runTest {
        coEvery { repository.deleteSet("s1") } returns Result.success(Unit)
        every { repository.getSets() } returns flowOf(Result.success(emptyList()))
        coEvery { repository.getStreak() } returns Result.success(0)

        viewModel.deleteSet("s1")
        advanceUntilIdle()

        coVerify { repository.deleteSet("s1") }
    }
}
