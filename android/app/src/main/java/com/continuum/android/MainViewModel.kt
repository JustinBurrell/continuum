package com.continuum.android

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val tokenManager: TokenManager,
    private val profileRepository: ProfileRepository,
) : ViewModel() {

    private val _isReady = MutableStateFlow(false)
    val isReady: StateFlow<Boolean> = _isReady.asStateFlow()

    init {
        viewModelScope.launch {
            if (tokenManager.getAccessToken() != null) {
                try {
                    withTimeout(3_000L) {
                        profileRepository.getProfile().getOrNull()
                            ?.let { profileRepository.primeSplashCache(it) }
                    }
                } catch (_: TimeoutCancellationException) {
                    // Network too slow — show dashboard and let it load normally
                } catch (_: Exception) {
                    // Auth error or offline — nav will redirect to login
                }
            }
            _isReady.value = true
        }
    }
}
