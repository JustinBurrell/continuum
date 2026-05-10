package com.continuum.android.feature.onboarding.presentation

import android.content.Context
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.onboarding.TourStepConfig
import com.continuum.android.feature.onboarding.getSectionConfig

private const val PREFS_NAME = "continuum_coach_mark"
private const val PREFS_KEY  = "first_run_section"

fun signalFirstRun(context: Context, sectionKey: String) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit().putString(PREFS_KEY, sectionKey).apply()
}

private fun clearFirstRun(context: Context) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit().remove(PREFS_KEY).apply()
}

@Composable
fun FirstRunCoachMark(navController: NavController) {
    val context = LocalContext.current
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    var config by remember { mutableStateOf<TourStepConfig?>(null) }

    // Re-check SharedPreferences each time the route changes (after navigation from activation)
    LaunchedEffect(currentRoute) {
        val key = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(PREFS_KEY, null) ?: return@LaunchedEffect
        config = getSectionConfig(key)
    }

    val dismiss: () -> Unit = {
        clearFirstRun(context)
        config = null
    }

    AnimatedVisibility(
        visible = config != null,
        enter = fadeIn() + slideInVertically { it / 2 },
        exit  = fadeOut() + slideOutVertically { it / 2 },
    ) {
        val cfg = config ?: return@AnimatedVisibility

        Box(modifier = Modifier.fillMaxSize()) {
            // Dimmed backdrop — blocks nav until dismissed
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.35f))
                    .clickable(onClick = dismiss),
            )

            // Feature card — bottom-right, mirrors web
            Card(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(24.dp)
                    .width(280.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = White),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
            ) {
                Column {
                    // Purple header
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(DeepPurple)
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                    ) {
                        Text(
                            text = cfg.sectionName.uppercase(),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White.copy(alpha = 0.6f),
                            letterSpacing = 1.sp,
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = cfg.heading,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            lineHeight = 20.sp,
                        )
                    }

                    // Body
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = cfg.description,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary,
                        )
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = dismiss,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = BrandPurple),
                            shape = RoundedCornerShape(8.dp),
                        ) {
                            Text("Got it", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }
}
