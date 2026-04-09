package com.continuum.android.core.ui

import androidx.compose.runtime.compositionLocalOf
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.core.network.NetworkMonitor

/**
 * CompositionLocals that provide singletons throughout the Compose tree
 * without threading them as parameters through every screen composable.
 *
 * Both are provided in [MainActivity] via CompositionLocalProvider.
 */
val LocalNetworkMonitor = compositionLocalOf<NetworkMonitor> {
    error("No NetworkMonitor provided — wrap with CompositionLocalProvider")
}

val LocalTokenManager = compositionLocalOf<TokenManager> {
    error("No TokenManager provided — wrap with CompositionLocalProvider")
}
