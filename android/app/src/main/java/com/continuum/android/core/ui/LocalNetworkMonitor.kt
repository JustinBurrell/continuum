package com.continuum.android.core.ui

import androidx.compose.runtime.compositionLocalOf
import com.continuum.android.core.network.NetworkMonitor

/**
 * CompositionLocal that provides [NetworkMonitor] throughout the Compose tree
 * without threading it as a parameter through every screen composable.
 *
 * Provided in [MainActivity] via CompositionLocalProvider.
 */
val LocalNetworkMonitor = compositionLocalOf<NetworkMonitor> {
    error("No NetworkMonitor provided — wrap with CompositionLocalProvider")
}
