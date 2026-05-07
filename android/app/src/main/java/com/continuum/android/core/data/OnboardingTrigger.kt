package com.continuum.android.core.data

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

sealed class OnboardingEvent {
    object Resume : OnboardingEvent()
    object Replay : OnboardingEvent()
}

@Singleton
class OnboardingTrigger @Inject constructor() {
    private val _events = MutableSharedFlow<OnboardingEvent>(extraBufferCapacity = 1)
    val events = _events.asSharedFlow()

    fun resume() = _events.tryEmit(OnboardingEvent.Resume)
    fun replay() = _events.tryEmit(OnboardingEvent.Replay)
}
