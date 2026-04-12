package com.continuum.android.feature.tasks.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.core.data.RefreshScope
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.tasks.data.remote.dto.UpdateTaskRequestDto
import com.continuum.android.feature.tasks.data.repository.TasksRepository
import com.continuum.android.feature.tasks.domain.Task
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TasksUiState(
    val tasks: List<Task> = emptyList(),
    val selectedStatus: String = "todo",
    val isSharedTab: Boolean = false,
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)

data class TaskDetailUiState(
    val task: Task? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val repository: TasksRepository,
    private val dataRefreshNotifier: DataRefreshNotifier,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _state = MutableStateFlow(TasksUiState())
    val state: StateFlow<TasksUiState> = _state.asStateFlow()

    private val _taskDetailState = MutableStateFlow(TaskDetailUiState())
    val taskDetailState: StateFlow<TaskDetailUiState> = _taskDetailState.asStateFlow()

    private var searchJob: Job? = null

    val todoTasks: StateFlow<List<Task>> = _state.map { it.tasks.filter { t -> t.status == "todo" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val inProgressTasks: StateFlow<List<Task>> = _state.map { it.tasks.filter { t -> t.status == "in_progress" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val completedTasks: StateFlow<List<Task>> = _state.map { it.tasks.filter { t -> t.status == "completed" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun loadTasks() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            repository.queryTasks(
                search = _state.value.searchQuery.trim().ifBlank { null },
                shared = _state.value.isSharedTab
            ).onSuccess { tasks ->
                _state.update { it.copy(tasks = tasks, isLoading = false) }
            }.onFailure { e ->
                _state.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun setSharedTab(shared: Boolean) {
        if (_state.value.isSharedTab == shared) return
        _state.update { it.copy(isSharedTab = shared) }
        loadTasks()
    }

    fun setStatus(status: String) {
        _state.update { it.copy(selectedStatus = status) }
    }

    fun setSearchQuery(query: String) {
        _state.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(250)
            loadTasks()
        }
    }

    fun createTask(
        title: String,
        description: String = "",
        priority: String? = null,
        type: String? = null,
        dueDate: String? = null,
        duration: Int? = null,
        isShared: Boolean = false,
        onCreated: () -> Unit = {}
    ) {
        viewModelScope.launch {
            repository.createTask(title, description, "todo", priority, type, dueDate, duration, isShared)
                .onSuccess { loadTasks(); dataRefreshNotifier.notifyDataChanged(RefreshScope.TASKS); onCreated() }
        }
    }

    fun moveTask(taskId: String, newStatus: String) {
        viewModelScope.launch {
            val task = _state.value.tasks.find { it.id == taskId }
            val result = if (task?.isShared == true) {
                repository.updateParticipantStatus(taskId, newStatus)
            } else {
                repository.updateStatus(taskId, newStatus)
            }
            result
                .onSuccess { task ->
                    _state.update { state ->
                        state.copy(tasks = state.tasks.map { if (it.id == taskId) task else it })
                    }
                }
        }
    }

    fun loadTaskDetail(taskId: String) {
        _taskDetailState.value = TaskDetailUiState(task = null, isLoading = true, error = null)
        viewModelScope.launch {
            repository.getTask(taskId)
                .onSuccess { task -> _taskDetailState.update { it.copy(task = task, isLoading = false) } }
                .onFailure { e -> _taskDetailState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun updateTaskStatus(taskId: String, status: String) {
        val task = _taskDetailState.value.task ?: return
        val myId = tokenManager.getJwtUserId() ?: return
        val isOwner = task.userId != null && task.userId == myId
        val isParticipant = task.participants.any { it.userId == myId }
        viewModelScope.launch {
            val result = when {
                isOwner -> repository.updateStatus(taskId, status)
                isParticipant -> repository.updateParticipantStatus(taskId, status)
                else -> return@launch
            }
            result
                .onSuccess { updated ->
                    _taskDetailState.update { it.copy(task = updated) }
                    _state.update { state ->
                        state.copy(tasks = state.tasks.map { if (it.id == taskId) updated else it })
                    }
                    dataRefreshNotifier.notifyDataChanged(RefreshScope.TASKS)
                }
        }
    }

    fun saveTaskEdits(
        taskId: String,
        title: String,
        description: String,
        priority: String?,
        type: String?,
        dueDate: String?,
        onDone: () -> Unit = {}
    ) {
        viewModelScope.launch {
            repository.updateTask(
                taskId,
                UpdateTaskRequestDto(
                    title = title,
                    description = description,
                    priority = priority,
                    type = type?.takeIf { it.isNotBlank() },
                    dueDate = dueDate?.takeIf { it.isNotBlank() }
                )
            ).onSuccess { task ->
                _taskDetailState.update { it.copy(task = task) }
                _state.update { state ->
                    state.copy(tasks = state.tasks.map { if (it.id == taskId) task else it })
                }
                dataRefreshNotifier.notifyDataChanged(RefreshScope.TASKS)
                onDone()
            }
        }
    }

    fun saveTaskParticipants(taskId: String, participantUserIds: List<String>, onDone: () -> Unit = {}) {
        viewModelScope.launch {
            repository.updateTaskParticipants(taskId, participantUserIds).onSuccess { task ->
                _taskDetailState.update { it.copy(task = task) }
                _state.update { state ->
                    state.copy(tasks = state.tasks.map { if (it.id == taskId) task else it })
                }
                dataRefreshNotifier.notifyDataChanged(RefreshScope.TASKS)
                onDone()
            }
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            repository.deleteTask(taskId).onSuccess {
                _state.update { it.copy(tasks = it.tasks.filter { t -> t.id != taskId }) }
                dataRefreshNotifier.notifyDataChanged(RefreshScope.TASKS)
            }
        }
    }
}
