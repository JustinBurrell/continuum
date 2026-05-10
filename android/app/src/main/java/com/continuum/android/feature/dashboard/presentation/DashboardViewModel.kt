package com.continuum.android.feature.dashboard.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.feature.career.data.remote.CareerApiService
import com.continuum.android.feature.career.domain.Application
import com.continuum.android.feature.flashcards.data.repository.FlashcardsRepository
import com.continuum.android.feature.flashcards.domain.FlashcardSet
import com.continuum.android.feature.notes.data.repository.NotesRepository
import com.continuum.android.feature.notes.domain.Note
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.social.data.remote.SocialApiService
import com.continuum.android.feature.social.domain.ActivityItem
import com.continuum.android.feature.tasks.data.repository.TasksRepository
import com.continuum.android.feature.tasks.domain.Task
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val isLoading: Boolean = true,
    val firstName: String = "there",
    val notesTotal: Int = 0,
    val flashcardSetCount: Int = 0,
    val recentNotes: List<Note> = emptyList(),
    val flashcardSets: List<FlashcardSet> = emptyList(),
    val recentActivity: List<ActivityItem> = emptyList(),
    val applications: List<Application> = emptyList(),
    val upcomingTasks: List<Task> = emptyList(),
    val openTaskCount: Int = 0,
    val openApplicationCount: Int = 0,
    val newActivityCount: Int = 0,
    val error: String? = null,
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val notesRepository: NotesRepository,
    private val tasksRepository: TasksRepository,
    private val flashcardsRepository: FlashcardsRepository,
    private val careerApi: CareerApiService,
    private val socialApi: SocialApiService,
    private val profileRepository: ProfileRepository,
    private val dataRefreshNotifier: DataRefreshNotifier,
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    // One-shot navigation event emitted when the profile signals onboarding is incomplete.
    // DashboardScreen collects this and calls onNavigateToOnboarding.
    private val _navigateToOnboarding = MutableSharedFlow<Unit>(extraBufferCapacity = 1)
    val navigateToOnboarding = _navigateToOnboarding.asSharedFlow()

    init {
        viewModelScope.launch {
            dataRefreshNotifier.refreshEvents.collect { load() }
        }
    }

    fun load() {
        viewModelScope.launch {
            // Phase 1 — serve cached Room data immediately so the screen is not blank.
            val cachedNotes = notesRepository.getCachedNotes()
            val cachedTasks = tasksRepository.getCachedTasks()
            val cachedSets = flashcardsRepository.getCachedSets()

            if (cachedNotes.isNotEmpty() || cachedTasks.isNotEmpty() || cachedSets.isNotEmpty()) {
                val openCached = cachedTasks.filter { it.status != "completed" }
                _state.update {
                    it.copy(
                        isLoading = false,
                        recentNotes = cachedNotes.take(5),
                        flashcardSets = cachedSets.take(5),
                        flashcardSetCount = cachedSets.size,
                        notesTotal = cachedNotes.size,
                        upcomingTasks = openCached.take(5),
                        openTaskCount = openCached.size
                    )
                }
            } else {
                _state.update { it.copy(isLoading = true, error = null) }
            }

            // Phase 2 — refresh from the network. All 5 calls launch in parallel;
            // activity launches as soon as profile returns (needs lastViewedActivityAt).
            try {
                var freshNotes: List<Note> = emptyList()
                var freshTasks: List<Task> = emptyList()
                var freshSets: List<FlashcardSet> = emptyList()

                val profileDeferred = async { profileRepository.getProfile() }
                val notesDeferred = async { notesRepository.getNotes().collect { freshNotes = it.getOrNull() ?: freshNotes } }
                val tasksDeferred = async { tasksRepository.getTasks().collect { freshTasks = it.getOrNull() ?: freshTasks } }
                val setsDeferred = async { flashcardsRepository.getSets().collect { freshSets = it.getOrNull() ?: freshSets } }
                val appsListDeferred = async { careerApi.getApplications() }

                // Profile is typically the fastest call; launch activity immediately after it
                // returns so both run in parallel with the heavier notes/tasks/sets flows.
                val profile = profileDeferred.await().getOrNull()
                val firstName = profile?.firstName?.ifBlank { "there" } ?: "there"
                val needsOnboarding = profile != null &&
                        (!profile.onboardingCompleted || !profile.tourCompleted)
                if (needsOnboarding) {
                    _navigateToOnboarding.tryEmit(Unit)
                }
                val activityDeferred = async { socialApi.getActivity(since = profile?.lastViewedActivityAt) }

                notesDeferred.await()
                tasksDeferred.await()
                setsDeferred.await()
                val allAppsDtos = appsListDeferred.await().applications
                val activityResp = activityDeferred.await()

                val openTasks = freshTasks
                    .filter { it.status != "completed" }
                    .sortedWith(
                        compareBy<Task> {
                            when (it.priority?.lowercase()) {
                                "high" -> 0
                                "medium" -> 1
                                else -> 2
                            }
                        }.thenBy { it.dueDate ?: "9999-12-31" }
                    )

                val activityItems = activityResp.feed.take(5).map { dto ->
                    val actorName = listOfNotNull(
                        dto.userId?.firstName?.takeIf { it.isNotBlank() },
                        dto.userId?.lastName?.takeIf { it.isNotBlank() }
                    ).joinToString(" ").ifBlank { dto.userId?.username ?: "Someone" }
                    ActivityItem(
                        id = dto.id,
                        type = dto.type,
                        actorId = dto.userId?.id,
                        actorName = actorName,
                        actorAvatar = dto.userId?.avatarUrl,
                        actorRoles = dto.userId?.roles ?: emptyList(),
                        resourceId = dto.targetId,
                        resourceTitle = dto.metadata?.noteTitle
                            ?: dto.metadata?.setTitle
                            ?: dto.metadata?.taskTitle
                            ?: dto.metadata?.commentPreview,
                        createdAt = dto.createdAt
                    )
                }

                val applications = allAppsDtos.take(5).map { dto ->
                    Application(
                        id = dto.id,
                        company = dto.company,
                        position = dto.position,
                        status = dto.status,
                        appliedDate = dto.appliedAt,
                        jobUrl = dto.jobUrl,
                        notes = dto.notes,
                        contacts = dto.contacts.map { contact ->
                            com.continuum.android.feature.career.domain.Contact(
                                name = contact.name,
                                role = contact.role,
                                linkedIn = contact.linkedIn ?: contact.email
                            )
                        },
                        updatedAt = dto.updatedAt
                    )
                }

                _state.update {
                    it.copy(
                        isLoading = false,
                        firstName = firstName,
                        notesTotal = freshNotes.size,
                        flashcardSetCount = freshSets.size,
                        recentNotes = freshNotes.take(5),
                        flashcardSets = freshSets.take(5),
                        recentActivity = activityItems,
                        applications = applications,
                        upcomingTasks = openTasks.take(5),
                        openTaskCount = openTasks.size,
                        openApplicationCount = allAppsDtos.size,
                        newActivityCount = activityResp.total,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun refresh() = load()
}
