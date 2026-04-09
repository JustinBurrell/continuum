package com.continuum.android.feature.notes.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.feature.notes.data.repository.NotesRepository
import com.continuum.android.feature.notes.domain.DriveFile
import com.continuum.android.feature.notes.domain.Note
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NotesUiState(
    val notes: List<Note> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

data class NoteDetailUiState(
    val note: Note? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSaving: Boolean = false
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
    private val repository: NotesRepository
) : ViewModel() {

    private val _listState = MutableStateFlow(NotesUiState())
    val listState: StateFlow<NotesUiState> = _listState.asStateFlow()

    private val _detailState = MutableStateFlow(NoteDetailUiState())
    val detailState: StateFlow<NoteDetailUiState> = _detailState.asStateFlow()

    private val _driveState = MutableStateFlow(DriveFilesUiState())
    val driveState: StateFlow<DriveFilesUiState> = _driveState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    val filteredNotes: StateFlow<List<Note>> = combine(_listState, _searchQuery) { state, query ->
        if (query.isBlank()) state.notes
        else state.notes.filter {
            it.title.contains(query, ignoreCase = true) ||
                it.preview.contains(query, ignoreCase = true) ||
                it.tags.any { tag -> tag.contains(query, ignoreCase = true) }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private var autoSaveJob: Job? = null

    fun loadNotes() {
        viewModelScope.launch {
            _listState.update { it.copy(isLoading = true, error = null) }
            repository.getNotes().collect { result ->
                result
                    .onSuccess { notes -> _listState.update { it.copy(notes = notes, isLoading = false) } }
                    .onFailure { e -> _listState.update { it.copy(isLoading = false, error = e.message) } }
            }
        }
    }

    fun loadNote(id: String) {
        viewModelScope.launch {
            _detailState.update { it.copy(isLoading = true, error = null) }
            repository.getNoteById(id)
                .onSuccess { note -> _detailState.update { it.copy(note = note, isLoading = false) } }
                .onFailure { e -> _detailState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun setSearchQuery(query: String) { _searchQuery.value = query }

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
                    onCreated(note.id)
                }
        }
    }

    fun deleteNote(id: String) {
        viewModelScope.launch {
            repository.deleteNote(id)
                .onSuccess { loadNotes() }
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
            repository.generateFlashcards(id)
        }
    }

    fun loadDriveFiles() {
        viewModelScope.launch {
            _driveState.update { it.copy(isLoading = true, error = null) }
            repository.getDriveFiles()
                .onSuccess { files -> _driveState.update { it.copy(files = files, isLoading = false) } }
                .onFailure { e -> _driveState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun importFromDrive(googleDocId: String, title: String) {
        viewModelScope.launch {
            _driveState.update { it.copy(isImporting = true) }
            repository.importFromDrive(googleDocId, title)
                .onSuccess { note ->
                    _driveState.update { it.copy(isImporting = false, importedNoteId = note.id) }
                    loadNotes()
                }
                .onFailure { e -> _driveState.update { it.copy(isImporting = false, error = e.message) } }
        }
    }

    fun clearImportedNoteId() { _driveState.update { it.copy(importedNoteId = null) } }
}
