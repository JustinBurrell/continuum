package com.continuum.android.core.ui.components

import androidx.compose.foundation.layout.BoxScope
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshDefaults
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.continuum.android.core.ui.theme.BrandPurple

/**
 * Drop-in replacement for PullToRefreshBox that fixes two issues with the raw API:
 *
 * 1. Separates pull-to-refresh visibility from isLoading — passing isLoading directly caused the
 *    indicator to appear during initial skeleton loads, intercepting scroll gestures and making
 *    lists feel "stuck".
 *
 * 2. Brands the indicator with BrandPurple so it matches the app design.
 *
 * The indicator only appears when the user explicitly pulls down. It disappears automatically
 * once isLoading returns to false (i.e., the refresh coroutine is done).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContinuumPullToRefresh(
    isLoading: Boolean,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit,
) {
    var isRefreshing by remember { mutableStateOf(false) }
    val state = rememberPullToRefreshState()

    LaunchedEffect(isLoading) {
        if (!isLoading) isRefreshing = false
    }

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = {
            isRefreshing = true
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
