package com.continuum.android.feature.flashcards.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.feature.flashcards.data.repository.FlashcardsRepository
import com.continuum.android.feature.flashcards.domain.Flashcard
import com.continuum.android.feature.flashcards.domain.FlashcardSet
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SetsUiState(
    val sets: List<FlashcardSet> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

data class StudyUiState(
    val cards: List<Flashcard> = emptyList(),
    val currentIndex: Int = 0,
    val isFlipped: Boolean = false,
    val correctCount: Int = 0,
    val incorrectCount: Int = 0,
    val isComplete: Boolean = false,
    val isLoading: Boolean = false
)

data class SetDetailUiState(
    val set: FlashcardSet? = null,
    val cards: List<Flashcard> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class FlashcardsViewModel @Inject constructor(
    private val repository: FlashcardsRepository
) : ViewModel() {

    private val _setsState = MutableStateFlow(SetsUiState())
    val setsState: StateFlow<SetsUiState> = _setsState.asStateFlow()

    private val _studyState = MutableStateFlow(StudyUiState())
    val studyState: StateFlow<StudyUiState> = _studyState.asStateFlow()

    private val _detailState = MutableStateFlow(SetDetailUiState())
    val detailState: StateFlow<SetDetailUiState> = _detailState.asStateFlow()

    fun loadSets() {
        viewModelScope.launch {
            _setsState.update { it.copy(isLoading = true, error = null) }
            repository.getSets().collect { result ->
                result
                    .onSuccess { sets -> _setsState.update { it.copy(sets = sets, isLoading = false) } }
                    .onFailure { e -> _setsState.update { it.copy(isLoading = false, error = e.message) } }
            }
        }
    }

    fun loadSetDetail(setId: String) {
        viewModelScope.launch {
            _detailState.update { it.copy(isLoading = true, error = null) }
            val setsFlow = repository.getSets()
            setsFlow.collect { result ->
                result.onSuccess { sets ->
                    val set = sets.find { it.id == setId }
                    _detailState.update { it.copy(set = set, isLoading = false) }
                }
            }
            repository.getCards(setId)
                .onSuccess { cards -> _detailState.update { it.copy(cards = cards) } }
                .onFailure { e -> _detailState.update { it.copy(error = e.message, isLoading = false) } }
        }
    }

    fun startStudy(setId: String) {
        viewModelScope.launch {
            _studyState.update { it.copy(isLoading = true) }
            repository.getCards(setId)
                .onSuccess { cards ->
                    _studyState.value = StudyUiState(cards = cards.shuffled(), isLoading = false)
                }
                .onFailure { _studyState.update { it.copy(isLoading = false) } }
        }
    }

    fun flipCard() {
        _studyState.update { it.copy(isFlipped = !it.isFlipped) }
    }

    fun answerCard(setId: String, correct: Boolean) {
        val state = _studyState.value
        val card = state.cards.getOrNull(state.currentIndex) ?: return

        viewModelScope.launch {
            repository.updateProgress(setId, card.id, correct)
        }

        val nextIndex = state.currentIndex + 1
        val isComplete = nextIndex >= state.cards.size
        _studyState.update {
            it.copy(
                currentIndex = if (isComplete) it.currentIndex else nextIndex,
                isFlipped = false,
                correctCount = if (correct) it.correctCount + 1 else it.correctCount,
                incorrectCount = if (!correct) it.incorrectCount + 1 else it.incorrectCount,
                isComplete = isComplete
            )
        }
    }

    fun restartStudy() {
        _studyState.update {
            it.copy(
                cards = it.cards.shuffled(),
                currentIndex = 0,
                isFlipped = false,
                correctCount = 0,
                incorrectCount = 0,
                isComplete = false
            )
        }
    }

    fun createSet(title: String, description: String, onCreated: () -> Unit) {
        viewModelScope.launch {
            repository.createSet(title, description)
                .onSuccess { loadSets(); onCreated() }
        }
    }

    fun generateSet(content: String, title: String, onCreated: () -> Unit) {
        viewModelScope.launch {
            repository.generateSet(content, title)
                .onSuccess { loadSets(); onCreated() }
        }
    }

    fun deleteSet(setId: String) {
        viewModelScope.launch {
            repository.deleteSet(setId).onSuccess { loadSets() }
        }
    }

    fun addCard(setId: String, front: String, back: String) {
        viewModelScope.launch {
            repository.createCard(setId, front, back)
                .onSuccess { loadSetDetail(setId) }
        }
    }

    fun updateCard(setId: String, cardId: String, front: String, back: String) {
        viewModelScope.launch {
            repository.updateCard(setId, cardId, front, back)
                .onSuccess { loadSetDetail(setId) }
        }
    }

    fun deleteCard(setId: String, cardId: String) {
        viewModelScope.launch {
            repository.deleteCard(setId, cardId)
                .onSuccess { loadSetDetail(setId) }
        }
    }
}
