package com.continuum.android.feature.career.presentation

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.feature.career.data.repository.CareerRepository
import com.continuum.android.feature.career.domain.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject

data class ApplicationsUiState(
    val applications: List<Application> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val statusFilter: String = "all",
    val searchQuery: String = ""
)

data class ResumesUiState(
    val resumes: List<Resume> = emptyList(),
    val isLoading: Boolean = false,
    val isUploading: Boolean = false,
    val error: String? = null,
    val searchQuery: String = ""
)

data class FeedbackUiState(
    val feedback: ResumeFeedback? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class CareerViewModel @Inject constructor(
    private val repository: CareerRepository
) : ViewModel() {
    private var applicationsSearchJob: Job? = null
    private var resumesSearchJob: Job? = null

    private val _applicationsState = MutableStateFlow(ApplicationsUiState())
    val applicationsState: StateFlow<ApplicationsUiState> = _applicationsState.asStateFlow()

    private val _resumesState = MutableStateFlow(ResumesUiState())
    val resumesState: StateFlow<ResumesUiState> = _resumesState.asStateFlow()

    private val _feedbackState = MutableStateFlow(FeedbackUiState())
    val feedbackState: StateFlow<FeedbackUiState> = _feedbackState.asStateFlow()

    val filteredApplications: StateFlow<List<Application>> = _applicationsState.map { state ->
        if (state.statusFilter == "all") state.applications
        else state.applications.filter { it.status == state.statusFilter }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun loadApplications() {
        viewModelScope.launch {
            _applicationsState.update { it.copy(isLoading = true, error = null) }
            repository.getApplications(
                search = _applicationsState.value.searchQuery,
                status = _applicationsState.value.statusFilter
            )
                .onSuccess { apps -> _applicationsState.update { it.copy(applications = apps, isLoading = false) } }
                .onFailure { e -> _applicationsState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun setStatusFilter(status: String) {
        _applicationsState.update { it.copy(statusFilter = status) }
        loadApplications()
    }

    fun setApplicationsSearchQuery(query: String) {
        _applicationsState.update { it.copy(searchQuery = query) }
        applicationsSearchJob?.cancel()
        applicationsSearchJob = viewModelScope.launch {
            delay(250)
            loadApplications()
        }
    }

    fun createApplication(company: String, position: String, status: String = "draft", jobUrl: String? = null, onCreated: () -> Unit = {}) {
        viewModelScope.launch {
            repository.createApplication(company, position, status, jobUrl)
                .onSuccess { loadApplications(); onCreated() }
        }
    }

    fun updateApplicationStatus(id: String, status: String) {
        viewModelScope.launch {
            repository.updateApplication(id, status, null)
                .onSuccess { updated ->
                    _applicationsState.update { state ->
                        state.copy(applications = state.applications.map { if (it.id == id) updated else it })
                    }
                }
        }
    }

    fun updateApplicationNotes(id: String, notes: String) {
        viewModelScope.launch {
            repository.updateApplication(id, null, notes)
        }
    }

    fun deleteApplication(id: String) {
        viewModelScope.launch {
            repository.deleteApplication(id).onSuccess {
                _applicationsState.update { it.copy(applications = it.applications.filter { a -> a.id != id }) }
            }
        }
    }

    private var allResumes: List<Resume> = emptyList()

    fun loadResumes() {
        viewModelScope.launch {
            _resumesState.update { it.copy(isLoading = true, error = null) }
            repository.getResumes()
                .onSuccess { resumes ->
                    allResumes = resumes
                    val query = _resumesState.value.searchQuery
                    val filtered = if (query.isBlank()) resumes else resumes.filter {
                        it.fileName.contains(query, ignoreCase = true) ||
                        it.targetRole.contains(query, ignoreCase = true)
                    }
                    _resumesState.update { it.copy(resumes = filtered, isLoading = false) }
                }
                .onFailure { e -> _resumesState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun setResumesSearchQuery(query: String) {
        _resumesState.update { it.copy(searchQuery = query) }
        resumesSearchJob?.cancel()
        resumesSearchJob = viewModelScope.launch {
            delay(250)
            val filtered = if (query.isBlank()) allResumes else allResumes.filter {
                it.fileName.contains(query, ignoreCase = true) ||
                it.targetRole.contains(query, ignoreCase = true)
            }
            _resumesState.update { it.copy(resumes = filtered) }
        }
    }

    fun uploadResume(context: Context, uri: Uri, fileName: String) {
        viewModelScope.launch {
            _resumesState.update { it.copy(isUploading = true) }
            try {
                val bytes = context.contentResolver.openInputStream(uri)?.readBytes() ?: return@launch
                val requestBody = bytes.toRequestBody("application/pdf".toMediaTypeOrNull())
                val part = MultipartBody.Part.createFormData("resume", fileName, requestBody)
                repository.uploadResume(part)
                    .onSuccess { loadResumes() }
                    .onFailure { e -> _resumesState.update { it.copy(error = e.message) } }
            } finally {
                _resumesState.update { it.copy(isUploading = false) }
            }
        }
    }

    fun deleteResume(id: String) {
        viewModelScope.launch {
            repository.deleteResume(id).onSuccess {
                _resumesState.update { it.copy(resumes = it.resumes.filter { r -> r.id != id }) }
            }
        }
    }

    fun loadFeedback(resumeId: String) {
        viewModelScope.launch {
            _feedbackState.update { it.copy(isLoading = true, error = null) }
            repository.generateFeedback(resumeId)
                .onSuccess { feedback -> _feedbackState.update { it.copy(feedback = feedback, isLoading = false) } }
                .onFailure { e -> _feedbackState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }
}
