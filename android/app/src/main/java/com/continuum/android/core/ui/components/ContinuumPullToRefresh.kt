package com.continuum.android.core.ui.components

import androidx.compose.foundation.layout.BoxScope
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.continuum.android.core.ui.theme.BrandPurple
import kotlinx.coroutines.delay

// Minimum time the spinner stays visible after a pull — mirrors Instagram's behaviour where
// the indicator always completes at least one full rotation before disappearing, even when
// data comes back instantly from cache.
private const val MIN_REFRESH_MS = 700L

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContinuumPullToRefresh(
    isLoading: Boolean,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit,
) {
    var isRefreshing by remember { mutableStateOf(false) }
    var refreshStartMs by remember { mutableLongStateOf(0L) }
    val state = rememberPullToRefreshState()

    // Wait until both: (a) the load is done AND (b) the spinner has been visible for at
    // least MIN_REFRESH_MS so it never flashes and disappears instantly.
    LaunchedEffect(isLoading) {
        if (!isLoading && isRefreshing) {
            val elapsed = System.currentTimeMillis() - refreshStartMs
            if (elapsed < MIN_REFRESH_MS) delay(MIN_REFRESH_MS - elapsed)
            isRefreshing = false
        }
    }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = {
            isRefreshing = true
            refreshStartMs = System.currentTimeMillis()
            onRefresh()
        },
        modifier = modifier,
        state = state,
        indicator = {
            PullToRefreshDefaults.Indicator(
                state = state,
                isRefreshing = isRefreshing,
                modifier = Modifier.align(Alignment.TopCenter),
                color = BrandPurple,
            )
        },
        content = content,
    )
}
