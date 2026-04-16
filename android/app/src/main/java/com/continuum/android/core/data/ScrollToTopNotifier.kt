package com.continuum.android.core.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Counter-based scroll-to-top signal for bottom-nav root screens.
 *
 * Using StateFlow<Int> rather than SharedFlow<Unit> so that screens which
 * are recomposing (e.g. returning from a detail screen after navigation)
 * don't accidentally receive a stale replay event and scroll to top
 * unexpectedly. Screens react via LaunchedEffect(count) { if (count > 0)
 * scrollToItem(0) } — which only fires when the counter actually changes,
 * not on every recomposition.
 */
@Singleton
class ScrollToTopNotifier @Inject constructor() {
    private val _counter = MutableStateFlow(0)
    val counter: StateFlow<Int> = _counter.asStateFlow()

    fun notifyScrollToTop() {
        _counter.value += 1
    }
}
