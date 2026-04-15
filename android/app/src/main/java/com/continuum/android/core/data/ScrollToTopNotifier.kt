package com.continuum.android.core.data

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Emits a unit event whenever the user taps a bottom-nav tab they're already at the root of.
 * Root list screens collect this flow and animate back to the top of their list.
 */
@Singleton
class ScrollToTopNotifier @Inject constructor() {
    private val _events = MutableSharedFlow<Unit>(extraBufferCapacity = 8)
    val events: SharedFlow<Unit> = _events.asSharedFlow()

    fun notifyScrollToTop() {
        _events.tryEmit(Unit)
    }
}
