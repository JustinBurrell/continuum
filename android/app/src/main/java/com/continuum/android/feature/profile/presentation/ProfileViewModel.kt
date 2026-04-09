package com.continuum.android.feature.profile.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.notes.data.remote.NotesApiService
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import com.continuum.android.feature.social.data.remote.SocialApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val isLoading: Boolean = true,
    val profile: Profile? = null,
    val notesCount: Int = 0,
    val friendsCount: Int = 0,
    val error: String? = null,
    val successMessage: String? = null,
    val isSaving: Boolean = false
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: ProfileRepository,
    private val tokenManager: TokenManager,
    private val notesApi: NotesApiService,
    private val socialApi: SocialApiService
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    fun load() {
        _state.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            val profileDeferred = async { repository.getProfile() }
            val notesDeferred   = async { runCatching { notesApi.getNotes() } }
            val friendsDeferred = async { runCatching { socialApi.getFriends() } }

            val profileResult  = profileDeferred.await()
            val notesResult    = notesDeferred.await()
            val friendsResult  = friendsDeferred.await()

            profileResult.fold(
                onSuccess = { profile ->
                    _state.update {
                        it.copy(
                            isLoading = false,
                            profile = profile,
                            notesCount = notesResult.getOrNull()?.notes?.size ?: 0,
                            friendsCount = friendsResult.getOrNull()?.friends?.size ?: 0
                        )
                    }
                },
                onFailure = { e ->
                    _state.update { it.copy(isLoading = false, error = e.message) }
                }
            )
        }
    }

    fun updateProfile(firstName: String, lastName: String, username: String, bio: String) {
        _state.update { it.copy(isSaving = true, error = null) }
        viewModelScope.launch {
            repository.updateProfile(firstName, lastName, username, bio).fold(
                onSuccess = { profile ->
                    _state.update { it.copy(isSaving = false, profile = profile, successMessage = "Profile updated") }
                },
                onFailure = { e ->
                    _state.update { it.copy(isSaving = false, error = e.message) }
                }
            )
        }
    }

    fun changePassword(current: String, new: String) {
        _state.update { it.copy(isSaving = true, error = null) }
        viewModelScope.launch {
            repository.changePassword(current, new).fold(
                onSuccess = {
                    _state.update { it.copy(isSaving = false, successMessage = "Password changed") }
                },
                onFailure = { e ->
                    _state.update { it.copy(isSaving = false, error = e.message) }
                }
            )
        }
    }

    fun deleteAccount(onComplete: () -> Unit) {
        viewModelScope.launch {
            repository.deleteAccount().fold(
                onSuccess = {
                    tokenManager.clearTokens()
                    onComplete()
                },
                onFailure = { e ->
                    _state.update { it.copy(error = e.message) }
                }
            )
        }
    }

    fun logout(onComplete: () -> Unit) {
        tokenManager.clearTokens()
        onComplete()
    }

    fun clearMessage() = _state.update { it.copy(successMessage = null, error = null) }
}
