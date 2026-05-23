package com.continuum.android.feature.dashboard

import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.feature.career.data.remote.CareerApiService
import com.continuum.android.feature.career.data.remote.dto.ApplicationDto
import com.continuum.android.feature.career.data.remote.dto.ApplicationsResponseDto
import com.continuum.android.feature.flashcards.data.repository.FlashcardsRepository
import com.continuum.android.feature.flashcards.domain.FlashcardSet
import com.continuum.android.feature.notes.data.repository.NotesRepository
import com.continuum.android.feature.notes.domain.Note
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import com.continuum.android.feature.profile.domain.PushNotificationSettings
import com.continuum.android.feature.social.data.remote.SocialApiService
import com.continuum.android.feature.social.data.remote.dto.ActivityResponseDto
import com.continuum.android.feature.tasks.data.repository.TasksRepository
import com.continuum.android.feature.tasks.domain.Task
import io.mockk.coEvery
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.launch
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class DashboardViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val notesRepository: NotesRepository = mockk()
    private val tasksRepository: TasksRepository = mockk()
    private val flashcardsRepository: FlashcardsRepository = mockk()
    private val careerApi: CareerApiService = mockk()
    private val socialApi: SocialApiService = mockk()
    private val profileRepository: ProfileRepository = mockk()
    private val notifier = DataRefreshNotifier()
    private lateinit var viewModel: com.continuum.android.feature.dashboard.presentation.DashboardViewModel

    private fun fakeNote(id: String = "n1") = Note(
        id = id, title = "Note $id", content = "", type = "general", tags = emptyList(),
        isFavorite = false, visibility = "private", googleDocId = null, googleDocUrl = null,
        pdfUrl = null, hasFlashcards = false, quickSummary = null, detailedSummary = null,
        updatedAt = "2025-01-01T00:00:00.000Z", createdAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakeTask(id: String = "t1", status: String = "todo") = Task(
        id = id, userId = "u1", title = "Task $id", description = "", status = status,
        priority = "medium", type = "homework", dueDate = "2030-01-01T00:00:00.000Z",
        duration = null, isShared = false, updatedAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakeSet(id: String = "s1") = FlashcardSet(
        id = id, title = "Set $id", description = "", cardCount = 2,
        isAIGenerated = false, lastStudied = null, updatedAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakeProfile(onboardingCompleted: Boolean = true) = Profile(
        id = "u1", firstName = "Justin", lastName = "B", username = "justin",
        email = "j@test.com", bio = null, avatarUrl = null, linkedinUrl = null,
        instagramHandle = null, isEmailVerified = true, isGoogleLinked = false, isDemo = false,
        pendingDeletion = false, scheduledDeletionAt = null, activityVisibility = "friends",
        emailNotifications = true, pushNotifications = PushNotificationSettings(), createdAt = "2025-01-01",
        onboardingCompleted = onboardingCompleted
    )

    private fun stubEmptyNetwork() {
        coEvery { notesRepository.getCachedNotes() } returns emptyList()
        coEvery { tasksRepository.getCachedTasks() } returns emptyList()
        coEvery { flashcardsRepository.getCachedSets() } returns emptyList()
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile())
        every { notesRepository.getNotes() } returns flowOf(Result.success(emptyList()))
        every { tasksRepository.getTasks() } returns flowOf(Result.success(emptyList()))
        every { flashcardsRepository.getSets() } returns flowOf(Result.success(emptyList()))
        coEvery { careerApi.getApplications(any(), any()) } returns ApplicationsResponseDto(true, emptyList())
        coEvery { socialApi.getActivity(any(), any(), any()) } returns ActivityResponseDto(true, emptyList())
    }

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        stubEmptyNetwork()
        viewModel = com.continuum.android.feature.dashboard.presentation.DashboardViewModel(
            notesRepository, tasksRepository, flashcardsRepository,
            careerApi, socialApi, profileRepository, notifier
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `load success — state populated with notes, tasks, sets`() = runTest {
        val notes = listOf(fakeNote("n1"), fakeNote("n2"))
        val tasks = listOf(fakeTask("t1"), fakeTask("t2"))
        val sets = listOf(fakeSet("s1"))
        every { notesRepository.getNotes() } returns flowOf(Result.success(notes))
        every { tasksRepository.getTasks() } returns flowOf(Result.success(tasks))
        every { flashcardsRepository.getSets() } returns flowOf(Result.success(sets))

        viewModel.load()
        advanceUntilIdle()

        val s = viewModel.state.value
        assertEquals(2, s.notesTotal)
        assertEquals(2, s.openTaskCount)
        assertEquals(1, s.flashcardSetCount)
        assertFalse(s.isLoading)
        assertNull(s.error)
    }

    @Test
    fun `load — firstName taken from profile`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile().copy(firstName = "Alex"))

        viewModel.load()
        advanceUntilIdle()

        assertEquals("Alex", viewModel.state.value.firstName)
    }

    @Test
    fun `load — onboarding redirect emitted when onboardingCompleted is false`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile(onboardingCompleted = false))

        val events = mutableListOf<Unit>()
        val job = launch(testDispatcher) {
            viewModel.navigateToOnboarding.collect { events.add(it) }
        }

        viewModel.load()
        advanceUntilIdle()
        job.cancel()

        assertEquals(1, events.size)
    }

    @Test
    fun `load — no redirect when onboardingCompleted is true`() = runTest {
        coEvery { profileRepository.getProfile() } returns Result.success(fakeProfile(onboardingCompleted = true))

        val events = mutableListOf<Unit>()
        val job = launch(testDispatcher) {
            viewModel.navigateToOnboarding.collect { events.add(it) }
        }

        viewModel.load()
        advanceUntilIdle()
        job.cancel()

        assertEquals(0, events.size)
    }

    @Test
    fun `load — open tasks sorted high priority first`() = runTest {
        val low = fakeTask("t1", "todo").copy(priority = "low")
        val high = fakeTask("t2", "todo").copy(priority = "high")
        every { tasksRepository.getTasks() } returns flowOf(Result.success(listOf(low, high)))

        viewModel.load()
        advanceUntilIdle()

        assertEquals("t2", viewModel.state.value.upcomingTasks.firstOrNull()?.id)
    }

    @Test
    fun `load — completed tasks excluded from openTaskCount`() = runTest {
        val tasks = listOf(fakeTask("t1", "todo"), fakeTask("t2", "completed"))
        every { tasksRepository.getTasks() } returns flowOf(Result.success(tasks))

        viewModel.load()
        advanceUntilIdle()

        assertEquals(1, viewModel.state.value.openTaskCount)
    }

    @Test
    fun `load — applications mapped from career API`() = runTest {
        val dto = ApplicationDto(id = "a1", company = "Anthropic", position = "SWE", status = "applied", updatedAt = "2025-01-01")
        coEvery { careerApi.getApplications(any(), any()) } returns ApplicationsResponseDto(true, listOf(dto))

        viewModel.load()
        advanceUntilIdle()

        assertEquals(1, viewModel.state.value.applications.size)
        assertEquals("Anthropic", viewModel.state.value.applications.first().company)
    }

    @Test
    fun `refresh delegates to load`() = runTest {
        val notes = listOf(fakeNote("n1"))
        every { notesRepository.getNotes() } returns flowOf(Result.success(notes))

        viewModel.refresh()
        advanceUntilIdle()

        assertEquals(1, viewModel.state.value.notesTotal)
    }

    @Test
    fun `load — cache populates state before network returns`() = runTest {
        val cachedNotes = listOf(fakeNote("cached"))
        coEvery { notesRepository.getCachedNotes() } returns cachedNotes
        coEvery { tasksRepository.getCachedTasks() } returns emptyList()
        coEvery { flashcardsRepository.getCachedSets() } returns emptyList()
        every { notesRepository.getNotes() } returns flowOf(Result.success(cachedNotes))

        viewModel.load()
        advanceUntilIdle()

        assertEquals(1, viewModel.state.value.notesTotal)
        assertFalse(viewModel.state.value.isLoading)
    }
}
