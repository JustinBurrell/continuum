package com.continuum.android.feature.flashcards.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.core.data.RefreshScope
import com.continuum.android.feature.flashcards.data.remote.dto.CardResultDto
import com.continuum.android.feature.flashcards.data.repository.FlashcardsRepository
import com.continuum.android.feature.flashcards.domain.Flashcard
import com.continuum.android.feature.flashcards.domain.FlashcardSet
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SetsUiState(
    val sets: List<FlashcardSet> = emptyList(),
    val searchQuery: String = "",
    val isSharedTab: Boolean = false,
    val streak: Int = 0,
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
    val isLoading: Boolean = false,
    val cardResults: List<CardResultDto> = emptyList(),
    val startTimeMs: Long = System.currentTimeMillis()
)

data class StudyHistoryUiState(
    val sessions: List<FlashcardsRepository.StudySession> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val streak: Int = 0
)

data class SetDetailStudyHistoryUiState(
    val sessions: List<FlashcardsRepository.StudySession> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

data class StudySessionDetailUiState(
    val loading: Boolean = false,
    val error: String? = null,
    val outcomes: List<FlashcardsRepository.StudySessionCardOutcome> = emptyList(),
    /** True after a terminal success (including empty outcomes) or failure; failures can be retried. */
    val fetchCompleted: Boolean = false
)

data class SetDetailUiState(
    val set: FlashcardSet? = null,
    val cards: List<Flashcard> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class FlashcardsViewModel @Inject constructor(
    private val repository: FlashcardsRepository,
    private val dataRefreshNotifier: DataRefreshNotifier
) : ViewModel() {

    private val _setsState = MutableStateFlow(SetsUiState())
    val setsState: StateFlow<SetsUiState> = _setsState.asStateFlow()

    private val _studyState = MutableStateFlow(StudyUiState())
    val studyState: StateFlow<StudyUiState> = _studyState.asStateFlow()

    private val _detailState = MutableStateFlow(SetDetailUiState())
    val detailState: StateFlow<SetDetailUiState> = _detailState.asStateFlow()

    private val _historyState = MutableStateFlow(StudyHistoryUiState())
    val historyState: StateFlow<StudyHistoryUiState> = _historyState.asStateFlow()

    private val _setDetailHistoryState = MutableStateFlow(SetDetailStudyHistoryUiState())
    val setDetailHistoryState: StateFlow<SetDetailStudyHistoryUiState> = _setDetailHistoryState.asStateFlow()

    private val _sessionDetailCache = MutableStateFlow<Map<String, StudySessionDetailUiState>>(emptyMap())
    val sessionDetailCache: StateFlow<Map<String, StudySessionDetailUiState>> = _sessionDetailCache.asStateFlow()

    private var searchJob: Job? = null

    fun loadSets() {
        val query = _setsState.value.searchQuery.trim()
        val shared = _setsState.value.isSharedTab
        // Fast path: no filter → cache-first Flow shows cached sets instantly while API refreshes
        if (query.isBlank() && !shared) {
            viewModelScope.launch {
                _setsState.update { it.copy(isLoading = true, error = null) }
                val streakDeferred = async { repository.getStreak() }
                repository.getSets().collect { result ->
                    result
                        .onSuccess { sets ->
                            _setsState.update {
                                it.copy(
                                    sets = sets,
                                    streak = streakDeferred.await().getOrDefault(0),
                                    isLoading = false
                                )
                            }
                        }
                        .onFailure { e ->
                            _setsState.update { it.copy(isLoading = false, error = e.message) }
                        }
                }
            }
        } else {
            viewModelScope.launch {
                _setsState.update { it.copy(isLoading = true, error = null) }
                val setsResult = repository.querySets(search = query.ifBlank { null }, shared = shared)
                val streakResult = if (!shared) repository.getStreak() else Result.success(0)
                setsResult.onSuccess { sets ->
                    _setsState.update {
                        it.copy(sets = sets, streak = streakResult.getOrDefault(0), isLoading = false)
                    }
                }.onFailure { e ->
                    _setsState.update { it.copy(isLoading = false, error = e.message) }
                }
            }
        }
    }

    fun setSharedTab(shared: Boolean) {
        if (_setsState.value.isSharedTab == shared) return
        _setsState.update { it.copy(isSharedTab = shared) }
        loadSets()
    }

    fun setSearchQuery(query: String) {
        _setsState.update { it.copy(searchQuery = query) }
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(250)
            loadSets()
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

    /**
     * @param syncToServer When false (demo account), only updates local study UI — no card progress or session POST.
     */
    fun answerCard(setId: String, correct: Boolean, syncToServer: Boolean = true) {
        val state = _studyState.value
        val card = state.cards.getOrNull(state.currentIndex) ?: return

        if (syncToServer) {
            viewModelScope.launch {
                repository.updateProgress(setId, card.id, correct)
            }
        }

        val newResults = state.cardResults + CardResultDto(card.id, correct)
        val nextIndex = state.currentIndex + 1
        val isComplete = nextIndex >= state.cards.size

        val newCorrect = if (correct) state.correctCount + 1 else state.correctCount
        val newIncorrect = if (!correct) state.incorrectCount + 1 else state.incorrectCount

        _studyState.update {
            it.copy(
                currentIndex = if (isComplete) it.currentIndex else nextIndex,
                isFlipped = false,
                correctCount = newCorrect,
                incorrectCount = newIncorrect,
                isComplete = isComplete,
                cardResults = newResults
            )
        }

        if (isComplete && syncToServer) {
            val totalCards = state.cards.size
            val score = if (totalCards > 0) (newCorrect * 100) / totalCards else 0
            val durationSeconds = ((System.currentTimeMillis() - state.startTimeMs) / 1000).toInt()
            viewModelScope.launch {
                repository.submitStudySession(setId, durationSeconds, totalCards, newCorrect, score, newResults)
            }
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
                .onSuccess { loadSets(); dataRefreshNotifier.notifyDataChanged(RefreshScope.FLASHCARDS); onCreated() }
        }
    }

    fun generateSet(content: String, title: String, onCreated: () -> Unit) {
        viewModelScope.launch {
            repository.generateSet(content, title)
                .onSuccess { loadSets(); dataRefreshNotifier.notifyDataChanged(RefreshScope.FLASHCARDS); onCreated() }
        }
    }

    fun deleteSet(setId: String) {
        viewModelScope.launch {
            repository.deleteSet(setId).onSuccess {
                loadSets()
                dataRefreshNotifier.notifyDataChanged(RefreshScope.FLASHCARDS)
            }
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

    fun loadStudyHistory() {
        _historyState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            val streakDeferred = async { repository.getStreak() }
            val sessionsResult = repository.getUserStudySessions(page = 1, limit = 50)
            val streak = streakDeferred.await().getOrDefault(0)
            sessionsResult
                .onSuccess { sessions ->
                    _historyState.update {
                        it.copy(sessions = sessions, streak = streak, isLoading = false, error = null)
                    }
                }
                .onFailure { e ->
                    _historyState.update { it.copy(isLoading = false, error = e.message, streak = streak) }
                }
        }
    }

    fun loadSetStudyHistory(setId: String) {
        _setDetailHistoryState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            repository.getSetStudySessions(setId, page = 1, limit = 50)
                .onSuccess { sessions ->
                    _setDetailHistoryState.update {
                        it.copy(sessions = sessions, isLoading = false, error = null)
                    }
                }
                .onFailure { e ->
                    _setDetailHistoryState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    /**
     * Loads per-card outcomes for GET /study-sessions/:id. Cached until process death;
     * skips refetch when [sessionId] already has a successful non-empty payload or is loading.
     */
    fun loadStudySessionDetail(sessionId: String) {
        val existing = _sessionDetailCache.value[sessionId]
        if (existing?.loading == true) return
        if (existing?.fetchCompleted == true && existing.error == null) return

        if (existing?.fetchCompleted == true && existing.error != null) {
            _sessionDetailCache.update { it - sessionId }
        }

        _sessionDetailCache.update { map ->
            map + (sessionId to StudySessionDetailUiState(loading = true, error = null, outcomes = emptyList()))
        }
        viewModelScope.launch {
            repository.getStudySessionDetail(sessionId)
                .onSuccess { outcomes ->
                    _sessionDetailCache.update { map ->
                        map + (
                            sessionId to StudySessionDetailUiState(
                                loading = false,
                                error = null,
                                outcomes = outcomes,
                                fetchCompleted = true
                            )
                            )
                    }
                }
                .onFailure { e ->
                    _sessionDetailCache.update { map ->
                        map + (
                            sessionId to StudySessionDetailUiState(
                                loading = false,
                                error = e.message,
                                outcomes = emptyList(),
                                fetchCompleted = true
                            )
                            )
                    }
                }
        }
    }

    fun duplicateSet(setId: String) {
        viewModelScope.launch {
            repository.duplicateSet(setId).onSuccess { loadSets() }
        }
    }

    fun updateSetInfo(setId: String, title: String, description: String) {
        viewModelScope.launch {
            repository.updateSet(setId, title.takeIf { it.isNotBlank() }, description.takeIf { it.isNotBlank() }, null)
                .onSuccess { loadSetDetail(setId) }
        }
    }

    fun makeSetPublic(setId: String) {
        viewModelScope.launch {
            repository.updateSet(setId, null, null, "public")
                .onSuccess { loadSetDetail(setId) }
        }
    }

    fun shareSetWithFriends(setId: String, friendIds: List<String>) {
        viewModelScope.launch {
            repository.shareSet(setId, friendIds)
                .onSuccess { loadSetDetail(setId) }
        }
    }
}
