package com.continuum.android.feature.dashboard.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.data.DataRefreshNotifier
import com.continuum.android.feature.career.data.remote.CareerApiService
import com.continuum.android.feature.career.domain.Application
import com.continuum.android.feature.flashcards.data.remote.FlashcardsApiService
import com.continuum.android.feature.flashcards.domain.FlashcardSet
import com.continuum.android.feature.notes.data.remote.NotesApiService
import com.continuum.android.feature.notes.domain.Note
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.social.data.remote.SocialApiService
import com.continuum.android.feature.social.domain.ActivityItem
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
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val notesApi: NotesApiService,
    private val tasksApi: TasksApiService,
    private val careerApi: CareerApiService,
    private val flashcardsApi: FlashcardsApiService,
    private val socialApi: SocialApiService,
    private val profileRepository: ProfileRepository,
    private val dataRefreshNotifier: DataRefreshNotifier
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            dataRefreshNotifier.refreshEvents.collect { load() }
        }
    }

    fun load() {
        _state.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            try {
                val profileDeferred = async { profileRepository.getProfile() }
                val notesDeferred = async { notesApi.getNotes() }
                val tasksDeferred = async { tasksApi.getTasks() }
                val appsDeferred  = async { careerApi.getApplicationsDashboard() }
                val setsDeferred = async { flashcardsApi.getSets() }
                val activityDeferred = async { socialApi.getActivity() }

                val firstName = profileDeferred.await().getOrNull()?.firstName?.ifBlank { "there" } ?: "there"
                val notesResp = notesDeferred.await()
                val tasksResp = tasksDeferred.await()
                val appsResp  = appsDeferred.await()
                val setsResp = setsDeferred.await()
                val activityResp = activityDeferred.await()

                val recentNotes = notesResp.notes.take(5).map { dto ->
                    Note(
                        id = dto.id,
                        title = dto.title,
                        content = dto.content,
                        type = dto.type?.ifBlank { "general" } ?: "general",
                        tags = dto.tags,
                        isFavorite = dto.isPinned,
                        visibility = dto.visibility,
                        googleDocId = dto.googleDocId,
                        hasFlashcards = dto.hasFlashcards,
                        quickSummary = dto.summary?.quick,
                        detailedSummary = dto.summary?.detailed,
                        updatedAt = dto.updatedAt,
                        createdAt = dto.createdAt
                    )
                }

                val openTasks = tasksResp.tasks
                    .filter { it.status != "completed" }
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
                    .sortedWith(
                        compareBy<Task> {
                            when (it.priority?.lowercase()) {
                                "high" -> 0
                                "medium" -> 1
                                else -> 2
                            }
                        }.thenBy { it.dueDate ?: "9999-12-31" }
                    )

                val flashcardSets = setsResp.sets.take(5).map { dto ->
                    FlashcardSet(
                        id = dto.id,
                        title = dto.title,
                        description = dto.description,
                        cardCount = dto.resolvedCardCount(),
                        isAIGenerated = dto.isAIGenerated,
                        lastStudied = dto.resolvedLastStudied(),
                        updatedAt = dto.updatedAt
                    )
                }

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
                        resourceId = dto.targetId,
                        resourceTitle = dto.metadata?.noteTitle
                            ?: dto.metadata?.setTitle
                            ?: dto.metadata?.taskTitle
                            ?: dto.metadata?.commentPreview,
                        createdAt = dto.createdAt
                    )
                }

                val applications = careerApi.getApplications().applications.take(5).map { dto ->
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
                        notesTotal = notesResp.notes.size,
                        flashcardSetCount = setsResp.sets.size,
                        recentNotes = recentNotes,
                        flashcardSets = flashcardSets,
                        recentActivity = activityItems,
                        applications = applications,
                        upcomingTasks = openTasks.take(5),
                        openTaskCount = openTasks.size,
                        openApplicationCount = appsResp.total,
                        newActivityCount = activityResp.total
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun refresh() = load()
}
