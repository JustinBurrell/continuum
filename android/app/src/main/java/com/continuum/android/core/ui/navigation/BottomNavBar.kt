package com.continuum.android.core.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.TextMuted

// ---------------------------------------------------------------------------
// Nav item definitions
// ---------------------------------------------------------------------------

data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector
)

val bottomNavItems = listOf(
    BottomNavItem(NavRoutes.Notes.ROOT, "Notes", Icons.Default.MenuBook),
    BottomNavItem(NavRoutes.Flashcards.ROOT, "Flashcards", Icons.Default.Style),
    BottomNavItem(NavRoutes.Tasks.ROOT, "Tasks", Icons.Default.CheckCircle),
    BottomNavItem(NavRoutes.Career.ROOT, "Career", Icons.Default.Work),
    BottomNavItem(NavRoutes.Social.ROOT, "Social", Icons.Default.People),
)

// ---------------------------------------------------------------------------
// Bottom navigation bar (compact + medium screens)
// ---------------------------------------------------------------------------

@Composable
fun ContinuumBottomBar(
    currentRoute: String?,
    navController: NavController
) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 0.dp
    ) {
        bottomNavItems.forEach { item ->
            val selected = currentRoute?.startsWith(item.route) == true
            NavigationBarItem(
                selected = selected,
                onClick = {
                    navController.navigate(item.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = {
                    Icon(imageVector = item.icon, contentDescription = item.label)
                },
                label = {
                    Text(text = item.label, fontSize = 11.sp)
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = BrandPurple,
                    selectedTextColor = BrandPurple,
                    unselectedIconColor = TextMuted,
                    unselectedTextColor = TextMuted,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Navigation rail (expanded screens — tablets, landscape)
// ---------------------------------------------------------------------------

@Composable
fun ContinuumNavigationRail(
    currentRoute: String?,
    navController: NavController
) {
    NavigationRail(
        containerColor = Color.White
    ) {
        bottomNavItems.forEach { item ->
            val selected = currentRoute?.startsWith(item.route) == true
            NavigationRailItem(
                selected = selected,
                onClick = {
                    navController.navigate(item.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = {
                    Icon(imageVector = item.icon, contentDescription = item.label)
                },
                label = {
                    Text(text = item.label, fontSize = 11.sp)
                },
                colors = NavigationRailItemDefaults.colors(
                    selectedIconColor = BrandPurple,
                    selectedTextColor = BrandPurple,
                    unselectedIconColor = TextMuted,
                    unselectedTextColor = TextMuted,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}
