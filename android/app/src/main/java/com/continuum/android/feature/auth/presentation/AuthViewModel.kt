package com.continuum.android.feature.auth.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.network.friendlyError
import com.continuum.android.feature.auth.data.repository.AuthRepository
import com.continuum.android.feature.auth.domain.User
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val user: User) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
    // Emitted for operations that succeed without returning a user (e.g. forgotPassword)
    object Done : AuthUiState()
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    fun checkAuthAndGetUser() {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.getMe()
                .onSuccess { user -> _uiState.value = AuthUiState.Success(user) }
                .onFailure { _uiState.value = AuthUiState.Idle }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.login(email, password)
                .onSuccess { user -> _uiState.value = AuthUiState.Success(user) }
                .onFailure { e -> _uiState.value = AuthUiState.Error(errorMessage(e)) }
        }
    }

    fun loginWithGoogle(idToken: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.loginWithGoogle(idToken)
                .onSuccess { user -> _uiState.value = AuthUiState.Success(user) }
                .onFailure { e -> _uiState.value = AuthUiState.Error(errorMessage(e)) }
        }
    }

    fun register(
        firstName: String,
        lastName: String,
        username: String,
        email: String,
        password: String
    ) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.register(firstName, lastName, username, email, password)
                .onSuccess { user -> _uiState.value = AuthUiState.Success(user) }
                .onFailure { e -> _uiState.value = AuthUiState.Error(errorMessage(e)) }
        }
    }

    fun forgotPassword(email: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.forgotPassword(email)
                .onSuccess { _uiState.value = AuthUiState.Done }
                .onFailure { e -> _uiState.value = AuthUiState.Error(errorMessage(e)) }
        }
    }

    fun resetPassword(token: String, newPassword: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.resetPassword(token, newPassword)
                .onSuccess { _uiState.value = AuthUiState.Done }
                .onFailure { e -> _uiState.value = AuthUiState.Error(errorMessage(e)) }
        }
    }

    fun verifyEmail(token: String) {
        viewModelScope.launch {
            _uiState.value = AuthUiState.Loading
            authRepository.verifyEmail(token)
                .onSuccess { _uiState.value = AuthUiState.Done }
                .onFailure { e -> _uiState.value = AuthUiState.Error(errorMessage(e)) }
        }
    }

    fun logout() {
        viewModelScope.launch { authRepository.logout() }
    }

    fun resetState() { _uiState.value = AuthUiState.Idle }

    fun setGoogleError(message: String) { _uiState.value = AuthUiState.Error(message) }

    private fun errorMessage(t: Throwable): String = friendlyError(t)
}
