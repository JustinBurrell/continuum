package com.continuum.android.core.data

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Lightweight event bus for cross-screen data freshness.
 * When any ViewModel mutates data (create, update, delete),
 * it calls [notifyDataChanged] so list/dashboard screens can reload.
 */
@Singleton
class DataRefreshNotifier @Inject constructor() {

    private val _refreshEvents = MutableSharedFlow<RefreshScope>(extraBufferCapacity = 8)
    val refreshEvents = _refreshEvents.asSharedFlow()

    fun notifyDataChanged(scope: RefreshScope = RefreshScope.ALL) {
        _refreshEvents.tryEmit(scope)
    }
}

enum class RefreshScope {
    NOTES, FLASHCARDS, TASKS, APPLICATIONS, PROFILE, ALL
}
