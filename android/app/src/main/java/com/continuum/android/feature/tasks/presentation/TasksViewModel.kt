package com.continuum.android.feature.tasks.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val repository: TasksRepository
) : ViewModel() {

    private val _state = MutableStateFlow(TasksUiState())
    val state: StateFlow<TasksUiState> = _state.asStateFlow()

    private var searchJob: Job? = null

    val todoTasks: StateFlow<List<Task>> = _state.map { it.tasks.filter { t -> t.status == "todo" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val inProgressTasks: StateFlow<List<Task>> = _state.map { it.tasks.filter { t -> t.status == "in_progress" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val doneTasks: StateFlow<List<Task>> = _state.map { it.tasks.filter { t -> t.status == "done" } }
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
                .onSuccess { loadTasks(); onCreated() }
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

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            repository.deleteTask(taskId).onSuccess {
                _state.update { it.copy(tasks = it.tasks.filter { t -> t.id != taskId }) }
            }
        }
    }
}
