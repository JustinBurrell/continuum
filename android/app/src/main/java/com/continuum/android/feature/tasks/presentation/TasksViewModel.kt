package com.continuum.android.feature.tasks.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.feature.tasks.data.repository.TasksRepository
import com.continuum.android.feature.tasks.domain.Task
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TasksUiState(
    val tasks: List<Task> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val repository: TasksRepository
) : ViewModel() {

    private val _state = MutableStateFlow(TasksUiState())
    val state: StateFlow<TasksUiState> = _state.asStateFlow()

    val todoTasks: StateFlow<List<Task>> = _state.map { it.tasks.filter { t -> t.status == "todo" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val inProgressTasks: StateFlow<List<Task>> = _state.map { it.tasks.filter { t -> t.status == "in_progress" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val doneTasks: StateFlow<List<Task>> = _state.map { it.tasks.filter { t -> t.status == "done" } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun loadTasks() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            repository.getTasks().collect { result ->
                result
                    .onSuccess { tasks -> _state.update { it.copy(tasks = tasks, isLoading = false) } }
                    .onFailure { e -> _state.update { it.copy(isLoading = false, error = e.message) } }
            }
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
            repository.updateStatus(taskId, newStatus)
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
