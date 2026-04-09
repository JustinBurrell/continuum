package com.continuum.android.feature.dashboard.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.feature.career.data.remote.CareerApiService
import com.continuum.android.feature.notes.data.remote.NotesApiService
import com.continuum.android.feature.notes.domain.Note
import com.continuum.android.feature.tasks.data.remote.TasksApiService
import com.continuum.android.feature.tasks.domain.Task
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val isLoading: Boolean = true,
    val firstName: String = "",
    val notesTotal: Int = 0,
    val recentNotes: List<Note> = emptyList(),
    val upcomingTasks: List<Task> = emptyList(),
    val openTaskCount: Int = 0,
    val openApplicationCount: Int = 0,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val notesApi: NotesApiService,
    private val tasksApi: TasksApiService,
    private val careerApi: CareerApiService
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    fun load(firstName: String) {
        _state.update { it.copy(isLoading = true, firstName = firstName, error = null) }
        viewModelScope.launch {
            try {
                val notesDeferred = async { notesApi.getNotes() }
                val tasksDeferred = async { tasksApi.getTasks() }
                val appsDeferred  = async { careerApi.getApplicationsDashboard() }

                val notesResp = notesDeferred.await()
                val tasksResp = tasksDeferred.await()
                val appsResp  = appsDeferred.await()

                val recentNotes = notesResp.data.take(5).map { dto ->
                    Note(
                        id = dto.id,
                        title = dto.title,
                        content = dto.content,
                        tags = dto.tags,
                        isFavorite = dto.isFavorite,
                        visibility = dto.visibility,
                        googleDocId = dto.googleDocId,
                        hasFlashcards = dto.hasFlashcards,
                        quickSummary = dto.summary?.quick,
                        detailedSummary = dto.summary?.detailed,
                        updatedAt = dto.updatedAt,
                        createdAt = dto.createdAt
                    )
                }

                val openTasks = tasksResp.data
                    .filter { it.status != "completed" && it.status != "done" }
                    .map { dto ->
                        Task(
                            id = dto.id,
                            title = dto.title,
                            description = dto.description,
                            status = dto.status,
                            priority = dto.priority,
                            type = dto.type,
                            dueDate = dto.dueDate,
                            duration = dto.duration,
                            isShared = dto.isShared,
                            updatedAt = dto.updatedAt
                        )
                    }

                _state.update {
                    it.copy(
                        isLoading = false,
                        notesTotal = notesResp.data.size,
                        recentNotes = recentNotes,
                        upcomingTasks = openTasks.take(3),
                        openTaskCount = openTasks.size,
                        openApplicationCount = appsResp.data.total
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun refresh(firstName: String) = load(firstName)
}
