package com.continuum.android.feature.profile.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import com.continuum.android.feature.profile.domain.Session
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val isLoading: Boolean = true,
    val profile: Profile? = null,
    val sessions: List<Session> = emptyList(),
    val sessionsLoading: Boolean = false,
    val error: String? = null,
    val successMessage: String? = null,
    val isSaving: Boolean = false,
    val verificationSent: Boolean = false,
    val logoutAllLoading: Boolean = false,
    val deleteLoading: Boolean = false,
    val restoreLoading: Boolean = false
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: ProfileRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    fun load() {
        _state.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            repository.getProfile().fold(
                onSuccess = { profile ->
                    _state.update { it.copy(isLoading = false, profile = profile) }
                    if (!profile.isDemo) loadSessions()
                },
                onFailure = { e ->
                    _state.update { it.copy(isLoading = false, error = e.message) }
                }
            )
        }
    }

    fun loadSessions() {
        _state.update { it.copy(sessionsLoading = true) }
        viewModelScope.launch {
            repository.getSessions().fold(
                onSuccess = { sessions ->
                    _state.update { it.copy(sessions = sessions, sessionsLoading = false) }
                },
                onFailure = {
                    _state.update { it.copy(sessionsLoading = false) }
                }
            )
        }
    }

    fun updateProfileFields(fields: Map<String, String>) {
        _state.update { it.copy(isSaving = true, error = null) }
        viewModelScope.launch {
            repository.updateProfileMultipart(fields).fold(
                onSuccess = { profile ->
                    _state.update { it.copy(isSaving = false, profile = profile, successMessage = "Profile updated") }
                },
                onFailure = { e ->
                    _state.update { it.copy(isSaving = false, error = e.message) }
                }
            )
        }
    }

    fun updateUsername(username: String) {
        _state.update { it.copy(isSaving = true, error = null) }
        viewModelScope.launch {
            repository.updateUsername(username).fold(
                onSuccess = { profile ->
                    _state.update { it.copy(isSaving = false, profile = profile, successMessage = "Username updated") }
                },
                onFailure = { e ->
                    val msg = e.message ?: "Failed to update username"
                    _state.update { it.copy(isSaving = false, error = if ("409" in msg || "taken" in msg.lowercase()) "Username is already taken" else msg) }
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

    fun sendVerificationEmail() {
        viewModelScope.launch {
            repository.sendVerificationEmail().fold(
                onSuccess = { _state.update { it.copy(verificationSent = true) } },
                onFailure = { e -> _state.update { it.copy(error = e.message) } }
            )
        }
    }

    fun revokeSession(sessionId: String) {
        viewModelScope.launch {
            repository.revokeSession(sessionId).onSuccess { loadSessions() }
        }
    }

    fun logoutAll(onComplete: () -> Unit) {
        _state.update { it.copy(logoutAllLoading = true) }
        viewModelScope.launch {
            repository.logoutAll()
            tokenManager.clearTokens()
            _state.update { it.copy(logoutAllLoading = false) }
            onComplete()
        }
    }

    fun deleteAccount(password: String, onComplete: () -> Unit) {
        _state.update { it.copy(deleteLoading = true, error = null) }
        viewModelScope.launch {
            repository.deleteAccount(password).fold(
                onSuccess = {
                    tokenManager.clearTokens()
                    _state.update { it.copy(deleteLoading = false) }
                    onComplete()
                },
                onFailure = { e ->
                    _state.update { it.copy(deleteLoading = false, error = e.message) }
                }
            )
        }
    }

    fun restoreAccount() {
        _state.update { it.copy(restoreLoading = true, error = null) }
        viewModelScope.launch {
            repository.restoreAccount().fold(
                onSuccess = { profile ->
                    _state.update { it.copy(restoreLoading = false, profile = profile, successMessage = "Account restored") }
                },
                onFailure = { e ->
                    _state.update { it.copy(restoreLoading = false, error = e.message) }
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
