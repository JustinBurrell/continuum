package com.continuum.android.feature.social.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.feature.social.data.repository.SocialRepository
import com.continuum.android.feature.social.domain.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ActivityUiState(
    val items: List<ActivityItem> = emptyList(),
    val isLoading: Boolean = false,
    val nextCursor: String? = null
)

data class FriendsUiState(
    val friends: List<Friend> = emptyList(),
    val incomingRequests: List<FriendRequest> = emptyList(),
    val isLoading: Boolean = false
)

data class UserSearchUiState(
    val results: List<UserSearchResult> = emptyList(),
    val isLoading: Boolean = false
)

data class SharedNoteUiState(
    val note: SharedNote? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSendingComment: Boolean = false
)

@HiltViewModel
class SocialViewModel @Inject constructor(
    private val repository: SocialRepository
) : ViewModel() {

    private val _activityState = MutableStateFlow(ActivityUiState())
    val activityState: StateFlow<ActivityUiState> = _activityState.asStateFlow()

    private val _friendsState = MutableStateFlow(FriendsUiState())
    val friendsState: StateFlow<FriendsUiState> = _friendsState.asStateFlow()

    private val _searchState = MutableStateFlow(UserSearchUiState())
    val searchState: StateFlow<UserSearchUiState> = _searchState.asStateFlow()

    private val _sharedNoteState = MutableStateFlow(SharedNoteUiState())
    val sharedNoteState: StateFlow<SharedNoteUiState> = _sharedNoteState.asStateFlow()

    private var searchJob: Job? = null

    fun loadActivity() {
        viewModelScope.launch {
            _activityState.update { it.copy(isLoading = true) }
            repository.getActivity()
                .onSuccess { (items, cursor) ->
                    _activityState.value = ActivityUiState(items = items, isLoading = false, nextCursor = cursor)
                }
                .onFailure { _activityState.update { it.copy(isLoading = false) } }
        }
    }

    fun loadMoreActivity() {
        val cursor = _activityState.value.nextCursor ?: return
        viewModelScope.launch {
            repository.getActivity(cursor)
                .onSuccess { (newItems, newCursor) ->
                    _activityState.update {
                        it.copy(items = it.items + newItems, nextCursor = newCursor)
                    }
                }
        }
    }

    fun loadFriends() {
        viewModelScope.launch {
            _friendsState.update { it.copy(isLoading = true) }
            val friendsResult = repository.getFriends()
            val requestsResult = repository.getFriendRequests()
            _friendsState.value = FriendsUiState(
                friends = friendsResult.getOrDefault(emptyList()),
                incomingRequests = requestsResult.getOrDefault(emptyList()),
                isLoading = false
            )
        }
    }

    fun sendFriendRequest(userId: String) {
        viewModelScope.launch {
            repository.sendFriendRequest(userId)
            // Refresh search results to show "pending" status
            val query = _searchState.value.results.firstOrNull()?.username ?: return@launch
            searchUsers(query)
        }
    }

    fun acceptRequest(requestId: String) {
        viewModelScope.launch {
            repository.acceptFriendRequest(requestId).onSuccess { loadFriends() }
        }
    }

    fun declineRequest(requestId: String) {
        viewModelScope.launch {
            repository.declineFriendRequest(requestId).onSuccess { loadFriends() }
        }
    }

    fun removeFriend(userId: String) {
        viewModelScope.launch {
            repository.removeFriend(userId).onSuccess { loadFriends() }
        }
    }

    fun searchUsers(query: String) {
        searchJob?.cancel()
        if (query.isBlank()) { _searchState.value = UserSearchUiState(); return }
        searchJob = viewModelScope.launch {
            delay(300) // debounce
            _searchState.update { it.copy(isLoading = true) }
            repository.searchUsers(query)
                .onSuccess { results -> _searchState.value = UserSearchUiState(results = results, isLoading = false) }
                .onFailure { _searchState.update { it.copy(isLoading = false) } }
        }
    }

    fun loadSharedNote(noteId: String) {
        viewModelScope.launch {
            _sharedNoteState.update { it.copy(isLoading = true, error = null) }
            repository.getSharedNote(noteId)
                .onSuccess { note -> _sharedNoteState.update { it.copy(note = note, isLoading = false) } }
                .onFailure { e -> _sharedNoteState.update { it.copy(isLoading = false, error = e.message) } }
        }
    }

    fun addComment(noteId: String, content: String) {
        viewModelScope.launch {
            _sharedNoteState.update { it.copy(isSendingComment = true) }
            repository.addComment(noteId, content)
                .onSuccess { loadSharedNote(noteId) }
            _sharedNoteState.update { it.copy(isSendingComment = false) }
        }
    }

    fun likeComment(noteId: String, commentId: String) {
        viewModelScope.launch {
            repository.likeComment(commentId)
        }
    }
}
