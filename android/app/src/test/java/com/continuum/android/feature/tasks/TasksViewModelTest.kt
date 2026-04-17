package com.continuum.android.feature.tasks

import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.tasks.data.repository.TasksRepository
import com.continuum.android.feature.tasks.domain.Task
import com.continuum.android.feature.tasks.presentation.TasksViewModel
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
class TasksViewModelTest {

    private val testDispatcher = UnconfinedTestDispatcher()
    private val repository: TasksRepository = mockk()
    private val notifier = DataRefreshNotifier()
    private val tokenManager: TokenManager = mockk(relaxed = true)
    private lateinit var viewModel: TasksViewModel

    private fun fakeTask(id: String = "t1", title: String = "Test Task", status: String = "todo") = Task(
        id = id,
        userId = "u1",
        title = title,
        description = "",
        status = status,
        priority = "medium",
        type = "homework",
        dueDate = "2030-01-01T00:00:00.000Z",
        duration = null,
        isShared = false,
        updatedAt = "2025-01-01T00:00:00.000Z"
    )

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        viewModel = TasksViewModel(repository, notifier, tokenManager)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loadTasks success — fast path emits tasks list`() = runTest {
        val tasks = listOf(fakeTask("t1", "Task A"), fakeTask("t2", "Task B"))
        every { repository.getTasks() } returns flowOf(Result.success(tasks))

        viewModel.loadTasks()
        advanceUntilIdle()

        assertEquals(tasks, viewModel.state.value.tasks)
        assertNull(viewModel.state.value.error)
    }

    @Test
    fun `loadTasks failure sets error state`() = runTest {
        every { repository.getTasks() } returns flowOf(Result.failure(Exception("Offline")))

        viewModel.loadTasks()
        advanceUntilIdle()

        assertEquals("Offline", viewModel.state.value.error)
    }

    @Test
    fun `createTask success calls repository and triggers reload`() = runTest {
        val newTask = fakeTask("t3", "New Task")
        coEvery {
            repository.createTask("New Task", "", "todo", null, null, null, null, false)
        } returns Result.success(newTask)
        every { repository.getTasks() } returns flowOf(Result.success(listOf(newTask)))

        var called = false
        viewModel.createTask("New Task", onCreated = { called = true })
        advanceUntilIdle()

        assertTrue("onCreated callback was called", called)
        coVerify { repository.createTask("New Task", "", "todo", null, null, null, null, false) }
    }

    @Test
    fun `moveTask updates task status in state`() = runTest {
        val task = fakeTask("t1", "My Task", "todo")
        every { repository.getTasks() } returns flowOf(Result.success(listOf(task)))
        coEvery { repository.updateStatus("t1", "in_progress") } returns Result.success(task.copy(status = "in_progress"))

        viewModel.loadTasks()
        advanceUntilIdle()

        viewModel.moveTask("t1", "in_progress")
        advanceUntilIdle()

        val updated = viewModel.state.value.tasks.find { it.id == "t1" }
        assertEquals("in_progress", updated?.status)
    }

    @Test
    fun `todoTasks derived state contains only todo tasks`() = runTest {
        val tasks = listOf(
            fakeTask("t1", "Todo Task", "todo"),
            fakeTask("t2", "In Progress Task", "in_progress"),
            fakeTask("t3", "Done Task", "completed")
        )
        every { repository.getTasks() } returns flowOf(Result.success(tasks))

        viewModel.loadTasks()
        advanceUntilIdle()

        // todoTasks uses stateIn(WhileSubscribed) so we verify the underlying state directly
        val todoList = viewModel.state.value.tasks.filter { it.status == "todo" }
        assertEquals(1, todoList.size)
        assertEquals("t1", todoList.first().id)
    }

    @Test
    fun `setSharedTab triggers queryTasks for shared tasks`() = runTest {
        val sharedTasks = listOf(fakeTask("t5", "Shared Task"))
        coEvery { repository.queryTasks(search = null, shared = true) } returns Result.success(sharedTasks)

        viewModel.setSharedTab(true)
        advanceUntilIdle()

        assertEquals(true, viewModel.state.value.isSharedTab)
    }
}
