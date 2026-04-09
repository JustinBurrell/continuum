package com.continuum.android.feature.profile.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class NavProfileUiState(
    val avatarUrl: String? = null,
    val displayName: String = "Profile",
    val isDemo: Boolean = false
)

@HiltViewModel
class NavProfileViewModel @Inject constructor(
    private val profileRepository: ProfileRepository
) : ViewModel() {

    private val _state = MutableStateFlow(NavProfileUiState())
    val state: StateFlow<NavProfileUiState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            profileRepository.getProfile()
                .onSuccess { profile ->
                    _state.update {
                        it.copy(
                            avatarUrl = profile.avatarUrl,
                            displayName = listOf(profile.firstName, profile.lastName)
                                .filter { name -> name.isNotBlank() }
                                .joinToString(" ")
                                .ifBlank { profile.username.ifBlank { "Profile" } },
                            isDemo = profile.isDemo
                        )
                    }
                }
        }
    }
}
