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
    val nextCursor: String? = null,
    val searchQuery: String = ""
)

data class FriendsUiState(
    val friends: List<Friend> = emptyList(),
    val incomingRequests: List<FriendRequest> = emptyList(),
    val sentRequests: List<FriendRequest> = emptyList(),
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

data class UserProfileUiState(
    val user: UserProfile? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

data class ThreadCommentsUiState(
    val comments: List<Comment> = emptyList(),
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val targetType: String? = null,
    val targetId: String? = null
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

    private val _userProfileState = MutableStateFlow(UserProfileUiState())
    val userProfileState: StateFlow<UserProfileUiState> = _userProfileState.asStateFlow()

    private val _threadCommentsState = MutableStateFlow(ThreadCommentsUiState())
    val threadCommentsState: StateFlow<ThreadCommentsUiState> = _threadCommentsState.asStateFlow()

    private var searchJob: Job? = null
    private var activitySearchJob: Job? = null

    private var allActivityItems: List<ActivityItem> = emptyList()

    fun loadActivity() {
        viewModelScope.launch {
            _activityState.update { it.copy(isLoading = true) }
            repository.getActivity()
                .onSuccess { (items, cursor) ->
                    allActivityItems = items
                    val query = _activityState.value.searchQuery
                    val filtered = if (query.isBlank()) items else items.filter {
                        it.actorName.contains(query, ignoreCase = true) ||
                        it.resourceTitle?.contains(query, ignoreCase = true) == true
                    }
                    _activityState.update { it.copy(items = filtered, isLoading = false, nextCursor = cursor) }
                }
                .onFailure { _activityState.update { it.copy(isLoading = false) } }
        }
    }

    fun markActivitySeen() {
        viewModelScope.launch { repository.markActivitySeen() }
    }

    fun setActivitySearch(query: String) {
        _activityState.update { it.copy(searchQuery = query) }
        activitySearchJob?.cancel()
        activitySearchJob = viewModelScope.launch {
            delay(300)
            val filtered = if (query.isBlank()) allActivityItems else allActivityItems.filter {
                it.actorName.contains(query, ignoreCase = true) ||
                it.resourceTitle?.contains(query, ignoreCase = true) == true
            }
            _activityState.update { it.copy(items = filtered) }
        }
    }

    fun loadMoreActivity() {
        val cursor = _activityState.value.nextCursor ?: return
        viewModelScope.launch {
            repository.getActivity(cursor)
                .onSuccess { (newItems, newCursor) ->
                    allActivityItems = allActivityItems + newItems
                    val query = _activityState.value.searchQuery
                    val filtered = if (query.isBlank()) allActivityItems else allActivityItems.filter {
                        it.actorName.contains(query, ignoreCase = true) ||
                        it.resourceTitle?.contains(query, ignoreCase = true) == true
                    }
                    _activityState.update {
                        it.copy(items = filtered, nextCursor = newCursor)
                    }
                }
        }
    }

    fun loadFriends() {
        viewModelScope.launch {
            _friendsState.update { it.copy(isLoading = true) }
            val friendsResult = repository.getFriends()
            val requestsResult = repository.getFriendRequests()
            val sentResult = repository.getSentRequests()
            _friendsState.value = FriendsUiState(
                friends = friendsResult.getOrDefault(emptyList()),
                incomingRequests = requestsResult.getOrDefault(emptyList()),
                sentRequests = sentResult.getOrDefault(emptyList()),
                isLoading = false
            )
        }
    }

    fun cancelSentRequest(requestId: String) {
        viewModelScope.launch {
            repository.cancelFriendRequest(requestId).onSuccess { loadFriends() }
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
        _threadCommentsState.value = ThreadCommentsUiState()
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

    fun loadThreadComments(targetType: String, targetId: String) {
        viewModelScope.launch {
            _threadCommentsState.value = ThreadCommentsUiState(
                isLoading = true,
                targetType = targetType,
                targetId = targetId
            )
            repository.getCommentsForTarget(targetType, targetId)
                .onSuccess { list ->
                    _threadCommentsState.update {
                        it.copy(comments = list, isLoading = false)
                    }
                }
                .onFailure {
                    _threadCommentsState.update { it.copy(isLoading = false) }
                }
        }
    }

    fun clearThreadComments() {
        _threadCommentsState.value = ThreadCommentsUiState()
    }

    fun addThreadComment(content: String, parentId: String?) {
        val t = _threadCommentsState.value.targetType ?: return
        val id = _threadCommentsState.value.targetId ?: return
        viewModelScope.launch {
            _threadCommentsState.update { it.copy(isSending = true) }
            repository.addCommentGeneric(t, id, content, parentId)
            repository.getCommentsForTarget(t, id)
                .onSuccess { list ->
                    _threadCommentsState.update { it.copy(comments = list, isSending = false) }
                }
                .onFailure {
                    _threadCommentsState.update { it.copy(isSending = false) }
                }
        }
    }

    fun likeThreadComment(commentId: String) {
        val t = _threadCommentsState.value.targetType ?: return
        val id = _threadCommentsState.value.targetId ?: return
        viewModelScope.launch {
            repository.likeComment(commentId)
            repository.getCommentsForTarget(t, id)
                .onSuccess { list -> _threadCommentsState.update { it.copy(comments = list) } }
        }
    }

    fun loadUserProfile(userId: String) {
        _userProfileState.value = UserProfileUiState(user = null, isLoading = true, error = null)
        viewModelScope.launch {
            repository.getUserProfile(userId)
                .onSuccess { user ->
                    _userProfileState.update { it.copy(user = user, isLoading = false, error = null) }
                }
                .onFailure { e ->
                    _userProfileState.update { it.copy(user = null, isLoading = false, error = e.message) }
                }
        }
    }

    fun sendFriendRequestFromProfile(userId: String) {
        viewModelScope.launch {
            repository.sendFriendRequest(userId).onSuccess { loadUserProfile(userId) }
        }
    }

    fun acceptIncomingFromProfile(userId: String) {
        val requestId = _userProfileState.value.user?.incomingRequestId ?: return
        viewModelScope.launch {
            repository.acceptFriendRequest(requestId).onSuccess { loadUserProfile(userId) }
        }
    }

    fun declineIncomingFromProfile(userId: String) {
        val requestId = _userProfileState.value.user?.incomingRequestId ?: return
        viewModelScope.launch {
            repository.declineFriendRequest(requestId).onSuccess { loadUserProfile(userId) }
        }
    }

    fun cancelOutgoingFromProfile(userId: String) {
        val requestId = _userProfileState.value.user?.outgoingRequestId ?: return
        viewModelScope.launch {
            repository.cancelFriendRequest(requestId).onSuccess { loadUserProfile(userId) }
        }
    }

    fun removeFriendFromProfile(userId: String) {
        val friendshipId = _userProfileState.value.user?.friendshipId ?: return
        viewModelScope.launch {
            repository.removeFriend(friendshipId).onSuccess { loadUserProfile(userId) }
        }
    }
}
