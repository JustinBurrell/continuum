package com.continuum.android

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.rememberNavController
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.core.ui.LocalNetworkMonitor
import com.continuum.android.core.ui.LocalProfileRepository
import com.continuum.android.core.ui.LocalTokenManager
import com.continuum.android.core.ui.navigation.AppNavHost
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.core.ui.theme.ContinuumTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var tokenManager: TokenManager
    @Inject lateinit var networkMonitor: NetworkMonitor
    @Inject lateinit var profileRepository: ProfileRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        splashScreen.setOnExitAnimationListener { provider ->
            val iconView = provider.iconView
            val splashView = provider.view

            // Compute scale needed to make the icon fill the screen (X-style zoom)
            val targetScale = maxOf(
                splashView.width.toFloat() / iconView.width.coerceAtLeast(1),
                splashView.height.toFloat() / iconView.height.coerceAtLeast(1)
            ) * 1.5f

            val scaleX = ObjectAnimator.ofFloat(iconView, View.SCALE_X, 1f, targetScale)
            val scaleY = ObjectAnimator.ofFloat(iconView, View.SCALE_Y, 1f, targetScale)
            val fade = ObjectAnimator.ofFloat(splashView, View.ALPHA, 1f, 0f)

            AnimatorSet().apply {
                playTogether(scaleX, scaleY, fade)
                duration = 420L
                interpolator = DecelerateInterpolator(1.5f)
                start()
            }

            // Remove the splash view after the animation completes
            iconView.postDelayed({ provider.remove() }, 420L)
        }

        setContent {
            val isAuthenticated by tokenManager.isLoggedIn.collectAsStateWithLifecycle()
            ContinuumTheme {
                CompositionLocalProvider(
                    LocalNetworkMonitor provides networkMonitor,
                    LocalTokenManager provides tokenManager,
                    LocalProfileRepository provides profileRepository,
                ) {
                    val navController = rememberNavController()
                    AppNavHost(
                        isAuthenticated = isAuthenticated,
                        navController = navController,
                        onSensitiveScreenEntered = {
                            window.setFlags(
                                WindowManager.LayoutParams.FLAG_SECURE,
                                WindowManager.LayoutParams.FLAG_SECURE
                            )
                        },
                        onSensitiveScreenExited = {
                            window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                        }
                    )
                }
            }
        }
    }
}
