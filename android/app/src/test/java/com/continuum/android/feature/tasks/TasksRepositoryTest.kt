package com.continuum.android.feature.tasks

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.TaskDao
import com.continuum.android.core.data.local.TaskEntity
import com.continuum.android.feature.tasks.data.remote.TasksApiService
import com.continuum.android.feature.tasks.data.remote.dto.TaskDto
import com.continuum.android.feature.tasks.data.remote.dto.TasksResponseDto
import com.continuum.android.feature.tasks.data.remote.dto.TaskResponseDto
import com.continuum.android.feature.tasks.data.repository.TasksRepository
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

class TasksRepositoryTest {

    private val api: TasksApiService = mockk()
    private val db: AppDatabase = mockk()
    private val taskDao: TaskDao = mockk(relaxed = true)
    private lateinit var repository: TasksRepository

    private fun fakeTaskDto(id: String = "t1", title: String = "Task", status: String = "todo") = TaskDto(
        id = id, userId = "u1", title = title, description = "", status = status,
        priority = "medium", type = "homework", dueDate = "2030-01-01T00:00:00.000Z",
        updatedAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakeTaskEntity(id: String = "t1", title: String = "Task", status: String = "todo") = TaskEntity(
        id = id, title = title, description = "", status = status,
        priority = "medium", dueDate = "2030-01-01T00:00:00.000Z", updatedAt = "2025-01-01T00:00:00.000Z"
    )

    private fun fakePage(tasks: List<TaskDto> = emptyList()) = TasksResponseDto(
        success = true, tasks = tasks, pagination = null
    )

    @Before
    fun setUp() {
        every { db.taskDao() } returns taskDao
        repository = TasksRepository(api, db)
    }

    @Test
    fun `getCachedTasks — returns domain tasks from Room`() = runTest {
        coEvery { taskDao.getAll() } returns listOf(fakeTaskEntity("t1"), fakeTaskEntity("t2"))

        val result = repository.getCachedTasks()

        assertEquals(2, result.size)
    }

    @Test
    fun `getTasks flow — emits cache first then network`() = runTest {
        coEvery { taskDao.getAll() } returns listOf(fakeTaskEntity("t1")) andThen listOf(fakeTaskEntity("t2"))
        coEvery { api.getTasks(any(), any(), any()) } returns fakePage(listOf(fakeTaskDto("t2")))

        val emissions = repository.getTasks().toList()

        assertTrue(emissions.size >= 1)
        assertTrue(emissions.first().isSuccess)
    }

    @Test
    fun `getTasks flow — failure when cache empty and network fails`() = runTest {
        coEvery { taskDao.getAll() } returns emptyList()
        coEvery { api.getTasks(any(), any(), any()) } throws RuntimeException("Network error")

        val emissions = repository.getTasks().toList()

        assertTrue(emissions.first().isFailure)
    }

    @Test
    fun `createTask success — inserts into Room and returns domain task`() = runTest {
        val dto = fakeTaskDto("t3", "New Task")
        coEvery { api.createTask(any()) } returns TaskResponseDto(success = true, task = dto)

        val result = repository.createTask(
            "New Task", "", "todo", "medium", "homework",
            "2030-01-01T00:00:00.000Z", null, false
        )

        assertTrue(result.isSuccess)
        assertEquals("t3", result.getOrNull()?.id)
        coVerify { taskDao.insert(any()) }
    }

    @Test
    fun `createTask failure — returns failure`() = runTest {
        coEvery { api.createTask(any()) } throws RuntimeException("Validation failed")

        val result = repository.createTask("", "", "todo", null, null, null, null, false)

        assertTrue(result.isFailure)
    }

    @Test
    fun `updateStatus success — updates Room cache`() = runTest {
        val dto = fakeTaskDto("t1", status = "in_progress")
        coEvery { api.updateTaskStatus("t1", any()) } returns TaskResponseDto(success = true, task = dto)

        val result = repository.updateStatus("t1", "in_progress")

        assertTrue(result.isSuccess)
        assertEquals("in_progress", result.getOrNull()?.status)
        coVerify { taskDao.insert(any()) }
    }

    @Test
    fun `deleteTask success — removes from Room`() = runTest {
        coEvery { api.deleteTask("t1") } returns mockk(relaxed = true)

        val result = repository.deleteTask("t1")

        assertTrue(result.isSuccess)
        coVerify { taskDao.deleteById("t1") }
    }

    @Test
    fun `queryTasks shared path — calls getSharedTasks`() = runTest {
        coEvery { api.getSharedTasks(any()) } returns fakePage(listOf(fakeTaskDto("shared1")))

        val result = repository.queryTasks(shared = true)

        assertTrue(result.isSuccess)
        assertEquals("shared1", result.getOrNull()?.first()?.id)
    }

    @Test
    fun `getTask — returns domain task from API`() = runTest {
        coEvery { api.getTask("t1") } returns TaskResponseDto(success = true, task = fakeTaskDto("t1"))

        val result = repository.getTask("t1")

        assertTrue(result.isSuccess)
        assertEquals("t1", result.getOrNull()?.id)
    }
}
