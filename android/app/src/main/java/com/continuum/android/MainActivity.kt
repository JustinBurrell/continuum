package com.continuum.android

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import androidx.navigation.compose.rememberNavController
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.core.ui.LocalNetworkMonitor
import com.continuum.android.core.ui.navigation.AppNavHost
import com.continuum.android.core.ui.theme.ContinuumTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var tokenManager: TokenManager
    @Inject lateinit var networkMonitor: NetworkMonitor

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val isAuthenticated = tokenManager.getAccessToken() != null

        setContent {
            ContinuumTheme {
                CompositionLocalProvider(LocalNetworkMonitor provides networkMonitor) {
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
