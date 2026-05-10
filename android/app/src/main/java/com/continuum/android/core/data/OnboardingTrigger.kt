package com.continuum.android.core.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

sealed class OnboardingEvent {
    object Resume : OnboardingEvent()
    object Replay : OnboardingEvent()
}

/**
 * Persistent pending-event store for the onboarding trigger.
 *
 * Using MutableStateFlow (rather than SharedFlow) guarantees the event is
 * delivered to DashboardViewModel even when it is created AFTER the event fires
 * (e.g. when navigation creates a fresh NavBackStackEntry). The ViewModel calls
 * consume() once it has handled the event so later re-entries don't re-show the sheet.
 */
@Singleton
class OnboardingTrigger @Inject constructor() {
    private val _pendingEvent = MutableStateFlow<OnboardingEvent?>(null)
    val pendingEvent = _pendingEvent.asStateFlow()

    fun resume() { _pendingEvent.value = OnboardingEvent.Resume }
    fun replay() { _pendingEvent.value = OnboardingEvent.Replay }
    fun consume() { _pendingEvent.value = null }
}
