package com.continuum.android.feature.tasks.data.repository

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.TaskEntity
import com.continuum.android.feature.tasks.data.remote.TasksApiService
import com.continuum.android.feature.tasks.data.remote.dto.*
import com.continuum.android.feature.tasks.domain.Task
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TasksRepository @Inject constructor(
    private val api: TasksApiService,
    private val db: AppDatabase
) {
    suspend fun queryTasks(search: String? = null, shared: Boolean = false): Result<List<Task>> = runCatching {
        val remote = if (shared) {
            api.getSharedTasks(search = search?.takeIf { it.isNotBlank() }).tasks
        } else {
            api.getTasks(search = search?.takeIf { it.isNotBlank() }).tasks
        }
        if (!shared && search.isNullOrBlank()) {
            taskDao.deleteAll()
            taskDao.insertAll(remote.map { it.toEntity() })
        }
        remote.map { it.toDomain() }
    }

    private val taskDao get() = db.taskDao()

    fun getTasks(): Flow<Result<List<Task>>> = flow {
        val cached = taskDao.getAll().map { it.toDomain() }
        if (cached.isNotEmpty()) emit(Result.success(cached))
        try {
            val fresh = api.getTasks().tasks
            taskDao.deleteAll()
            taskDao.insertAll(fresh.map { it.toEntity() })
            emit(Result.success(taskDao.getAll().map { it.toDomain() }))
        } catch (e: IOException) {
            if (cached.isEmpty()) emit(Result.failure(e))
        } catch (e: Exception) {
            if (cached.isEmpty()) emit(Result.failure(e))
        }
    }

    suspend fun createTask(
        title: String, description: String, status: String, priority: String?,
        type: String?, dueDate: String?, duration: Int?, isShared: Boolean
    ): Result<Task> = runCatching {
        val task = api.createTask(
            CreateTaskRequestDto(title, description, status, priority, type, dueDate, duration, isShared)
        ).task
        taskDao.insert(task.toEntity())
        task.toDomain()
    }

    suspend fun updateStatus(id: String, status: String): Result<Task> = runCatching {
        val task = api.updateTaskStatus(id, UpdateTaskStatusRequestDto(status)).task
        taskDao.insert(task.toEntity())
        task.toDomain()
    }

    suspend fun updateParticipantStatus(id: String, status: String): Result<Task> = runCatching {
        val task = api.updateParticipantTaskStatus(id, UpdateTaskStatusRequestDto(status)).task
        taskDao.insert(task.toEntity())
        task.toDomain()
    }

    suspend fun deleteTask(id: String): Result<Unit> = runCatching {
        api.deleteTask(id)
        taskDao.deleteById(id)
    }

    // Mappers
    private fun TaskDto.toEntity() = TaskEntity(
        id = id, title = title, description = description, status = status,
        priority = priority, dueDate = dueDate, updatedAt = updatedAt
    )
    private fun TaskEntity.toDomain() = Task(
        id = id, title = title, description = description, status = status,
        priority = priority, type = null, dueDate = dueDate, duration = null,
        isShared = false, updatedAt = updatedAt
    )
    private fun TaskDto.toDomain() = Task(
        id = id, title = title, description = description, status = status,
        priority = priority, type = type, dueDate = dueDate, duration = duration,
        isShared = isShared, updatedAt = updatedAt
    )
}
