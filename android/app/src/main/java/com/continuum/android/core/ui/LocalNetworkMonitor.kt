package com.continuum.android.core.ui

import androidx.compose.runtime.compositionLocalOf
import com.continuum.android.core.data.ScrollToTopNotifier
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.feature.profile.data.repository.ProfileRepository

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

/** True when the signed-in account is the read-only demo user (from nav profile). */
val LocalIsDemo = compositionLocalOf<Boolean> {
    false
}

/** Emits Unit when the user taps a bottom-nav tab they are already at the root of. */
val LocalScrollToTopNotifier = compositionLocalOf<ScrollToTopNotifier?> { null }

val LocalProfileRepository = compositionLocalOf<ProfileRepository> {
    error("No ProfileRepository provided — wrap with CompositionLocalProvider")
}
