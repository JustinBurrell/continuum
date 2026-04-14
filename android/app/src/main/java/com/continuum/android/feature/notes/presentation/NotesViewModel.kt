package com.continuum.android.feature.notes.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.core.data.RefreshScope
import com.continuum.android.feature.notes.data.repository.NotesRepository
import com.continuum.android.feature.notes.domain.DriveFile
import com.continuum.android.feature.notes.domain.Note
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotesUiState(
    val notes: List<Note> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSharedTab: Boolean = false,
    val selectedType: String = "all"
)

data class NoteDetailUiState(
    val note: Note? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSaving: Boolean = false,
    val isGeneratingFlashcards: Boolean = false,
    val generatedFlashcardSetId: String? = null,
    val flashcardGenerationError: String? = null
)

data class DriveFilesUiState(
    val files: List<DriveFile> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isImporting: Boolean = false,
    val importedNoteId: String? = null
)

@HiltViewModel
class NotesViewModel @Inject constructor(
    private val repository: NotesRepository,
    private val dataRefreshNotifier: DataRefreshNotifier
) : ViewModel() {

    private val _listState = MutableStateFlow(NotesUiState())
    val listState: StateFlow<NotesUiState> = _listState.asStateFlow()

    private val _detailState = MutableStateFlow(NoteDetailUiState())
    val detailState: StateFlow<NoteDetailUiState> = _detailState.asStateFlow()

    private val _driveState = MutableStateFlow(DriveFilesUiState())
    val driveState: StateFlow<DriveFilesUiState> = _driveState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val filteredNotes: StateFlow<List<Note>> = _listState
        .map { it.notes }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private var autoSaveJob: Job? = null
    private var searchJob: Job? = null

    fun loadNotes() {
        viewModelScope.launch {
            _listState.update { it.copy(isLoading = true, error = null) }
            repository.queryNotes(
                search = _searchQuery.value.trim().ifBlank { null },
                type = _listState.value.selectedType,
                shared = _listState.value.isSharedTab
            ).onSuccess { notes ->
                _listState.update { it.copy(notes = notes, isLoading = false) }
            }.onFailure { e ->
                _listState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun loadNote(id: String) {
        viewModelScope.launch {
            _detailState.update { NoteDetailUiState(isLoading = true, error = null, note = null) }
            repository.getNoteById(id)
                .onSuccess { note -> _detailState.update { it.copy(note = note, isLoading = false) } }
                .onFailure { e -> _detailState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(250)
            loadNotes()
        }
    }

    fun setSharedTab(shared: Boolean) {
        if (_listState.value.isSharedTab == shared) return
        _listState.update {
            it.copy(
                isSharedTab = shared,
                selectedType = if (shared) "all" else it.selectedType
            )
        }
        loadNotes()
    }

    fun setType(type: String) {
        if (_listState.value.selectedType == type) return
        _listState.update { it.copy(selectedType = type) }
        loadNotes()
    }

    fun scheduleAutoSave(id: String, title: String, content: String, tags: List<String>, visibility: String) {
        autoSaveJob?.cancel()
        autoSaveJob = viewModelScope.launch {
            delay(2000)
            _detailState.update { it.copy(isSaving = true) }
            repository.updateNote(id, title, content, tags, visibility)
                .onSuccess { note -> _detailState.update { it.copy(note = note, isSaving = false) } }
                .onFailure { _detailState.update { it.copy(isSaving = false) } }
        }
    }

    fun createNote(title: String, content: String = "", tags: List<String> = emptyList(), visibility: String = "private", onCreated: (String) -> Unit) {
        viewModelScope.launch {
            repository.createNote(title, content, tags, visibility)
                .onSuccess { note ->
                    loadNotes()
                    dataRefreshNotifier.notifyDataChanged(RefreshScope.NOTES)
                    onCreated(note.id)
                }
        }
    }

    fun deleteNote(id: String) {
        viewModelScope.launch {
            repository.deleteNote(id)
                .onSuccess {
                    loadNotes()
                    dataRefreshNotifier.notifyDataChanged(RefreshScope.NOTES)
                }
        }
    }

    fun generateSummary(id: String) {
        viewModelScope.launch {
            _detailState.update { it.copy(isLoading = true) }
            repository.generateSummary(id)
                .onSuccess { note -> _detailState.update { it.copy(note = note, isLoading = false) } }
                .onFailure { _detailState.update { it.copy(isLoading = false) } }
        }
    }

    fun generateFlashcards(id: String) {
        viewModelScope.launch {
            _detailState.update { it.copy(isGeneratingFlashcards = true, flashcardGenerationError = null) }
            repository.generateFlashcards(id)
                .onSuccess { setId ->
                    _detailState.update {
                        it.copy(
                            note = it.note?.copy(hasFlashcards = true),
                            isGeneratingFlashcards = false,
                            generatedFlashcardSetId = setId.ifBlank { null }
                        )
                    }
                }
                .onFailure { e ->
                    _detailState.update {
                        it.copy(isGeneratingFlashcards = false, flashcardGenerationError = e.message)
                    }
                }
        }
    }

    fun clearFlashcardGeneration() {
        _detailState.update { it.copy(generatedFlashcardSetId = null, flashcardGenerationError = null) }
    }

    fun loadDriveFiles() {
        viewModelScope.launch {
            _driveState.update { it.copy(isLoading = true, error = null) }
            repository.getDriveFiles()
                .onSuccess { files -> _driveState.update { it.copy(files = files, isLoading = false) } }
                .onFailure { e -> _driveState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun importFromDrive(googleDocId: String, googleDocUrl: String, title: String) {
        viewModelScope.launch {
            _driveState.update { it.copy(isImporting = true) }
            repository.importFromDrive(googleDocId, googleDocUrl, title)
                .onSuccess { note ->
                    _driveState.update { it.copy(isImporting = false, importedNoteId = note.id) }
                    loadNotes()
                }
                .onFailure { e -> _driveState.update { it.copy(isImporting = false, error = e.message) } }
        }
    }

    fun clearImportedNoteId() { _driveState.update { it.copy(importedNoteId = null) } }
}
