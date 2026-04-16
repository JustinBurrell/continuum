package com.continuum.android.feature.career

import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.feature.career.data.repository.CareerRepository
import com.continuum.android.feature.career.domain.Application
import com.continuum.android.feature.career.domain.Resume
import com.continuum.android.feature.career.presentation.CareerViewModel
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
class CareerViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: CareerRepository = mockk()
    private val notifier = DataRefreshNotifier()
    private lateinit var viewModel: CareerViewModel

    private fun fakeApp(id: String = "a1", company: String = "Anthropic", status: String = "applied") = Application(
        id = id,
        company = company,
        position = "Software Engineer",
        status = status,
        appliedDate = "2025-01-01",
        jobUrl = null,
        notes = "",
        contacts = emptyList(),
        reminders = emptyList(),
        updatedAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakeResume(id: String = "r1") = Resume(
        id = id,
        fileName = "resume.pdf",
        targetRole = "SWE",
        version = 1,
        uploadDate = "2025-01-01",
        cloudinaryUrl = "https://example.com/resume.pdf",
        aiScore = null
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = CareerViewModel(repository, notifier)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadApplications success — fast path emits applications list`() = runTest {
        val apps = listOf(fakeApp("a1", "Anthropic"), fakeApp("a2", "Google"))
        every { repository.getApplicationsFlow() } returns flowOf(Result.success(apps))

        viewModel.loadApplications()
        advanceUntilIdle()

        assertEquals(apps, viewModel.applicationsState.value.applications)
        assertNull(viewModel.applicationsState.value.error)
    }

    @Test
    fun `loadApplications failure sets error state`() = runTest {
        every { repository.getApplicationsFlow() } returns flowOf(Result.failure(Exception("Server error")))

        viewModel.loadApplications()
        advanceUntilIdle()

        assertEquals("Server error", viewModel.applicationsState.value.error)
    }

    @Test
    fun `createApplication success adds app and triggers reload`() = runTest {
        val newApp = fakeApp("a3", "Stripe", "draft")
        coEvery { repository.createApplication("Stripe", "PM", "draft", null) } returns Result.success(newApp)
        every { repository.getApplicationsFlow() } returns flowOf(Result.success(listOf(newApp)))

        var called = false
        viewModel.createApplication("Stripe", "PM", onCreated = { called = true })
        advanceUntilIdle()

        assertTrue("onCreated callback was called", called)
        coVerify { repository.createApplication("Stripe", "PM", "draft", null) }
    }

    @Test
    fun `updateApplicationStatus updates status in state optimistically`() = runTest {
        val app = fakeApp("a1", "Anthropic", "applied")
        every { repository.getApplicationsFlow() } returns flowOf(Result.success(listOf(app)))
        coEvery { repository.updateApplication("a1", "interview", null) } returns Result.success(app.copy(status = "interview"))

        viewModel.loadApplications()
        advanceUntilIdle()

        viewModel.updateApplicationStatus("a1", "interview")
        advanceUntilIdle()

        val updated = viewModel.applicationsState.value.applications.find { it.id == "a1" }
        assertEquals("interview", updated?.status)
    }

    @Test
    fun `deleteApplication removes app from state`() = runTest {
        val apps = listOf(fakeApp("a1"), fakeApp("a2"))
        every { repository.getApplicationsFlow() } returns flowOf(Result.success(apps))
        coEvery { repository.deleteApplication("a1") } returns Result.success(Unit)

        viewModel.loadApplications()
        advanceUntilIdle()

        viewModel.deleteApplication("a1")
        advanceUntilIdle()

        val remaining = viewModel.applicationsState.value.applications
        assertEquals(1, remaining.size)
        assertEquals("a2", remaining.first().id)
    }

    @Test
    fun `loadResumes success emits resumes list`() = runTest {
        val resumes = listOf(fakeResume("r1"), fakeResume("r2"))
        coEvery { repository.getResumes() } returns Result.success(resumes)

        viewModel.loadResumes()
        advanceUntilIdle()

        assertEquals(resumes, viewModel.resumesState.value.resumes)
    }

    @Test
    fun `filteredApplications derived state filters by status`() = runTest {
        val apps = listOf(
            fakeApp("a1", "Anthropic", "applied"),
            fakeApp("a2", "Google", "interview")
        )
        every { repository.getApplicationsFlow() } returns flowOf(Result.success(apps))

        viewModel.loadApplications()
        advanceUntilIdle()

        viewModel.setStatusFilter("interview")

        val filtered = viewModel.filteredApplications.value
        assertEquals(1, filtered.size)
        assertEquals("Google", filtered.first().company)
    }
}
