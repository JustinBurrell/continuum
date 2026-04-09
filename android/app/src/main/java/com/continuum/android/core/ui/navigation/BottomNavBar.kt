package com.continuum.android.core.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.Work
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.PurpleTint
import com.continuum.android.core.ui.theme.TextMuted
import com.continuum.android.core.ui.theme.White

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
    BottomNavItem(NavRoutes.Profile.ROOT, "Profile", Icons.Default.Person),
    BottomNavItem(NavRoutes.Calendar.ROOT, "Calendar", Icons.Default.CalendarMonth),
    BottomNavItem(NavRoutes.Applications.ROOT, "Applications", Icons.Default.Work),
    BottomNavItem(NavRoutes.Resumes.ROOT, "Resumes", Icons.Outlined.Description)
)

// ---------------------------------------------------------------------------
// Bottom navigation bar (compact + medium screens)
// ---------------------------------------------------------------------------

@Composable
fun ContinuumBottomBar(
    currentRoute: String?,
    navController: NavController,
    profileAvatarUrl: String? = null,
    profileDisplayName: String = "Profile"
) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 0.dp
    ) {
        bottomNavItems.forEach { item ->
            val selected = isSelectedRoute(currentRoute, item.route)
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
                    if (item.route == NavRoutes.Profile.ROOT) {
                        ProfileNavIcon(
                            selected = selected,
                            avatarUrl = profileAvatarUrl,
                            displayName = profileDisplayName
                        )
                    } else {
                        Icon(imageVector = item.icon, contentDescription = item.label)
                    }
                },
                alwaysShowLabel = false,
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = BrandPurple,
                    unselectedIconColor = TextMuted,
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
    navController: NavController,
    profileAvatarUrl: String? = null,
    profileDisplayName: String = "Profile"
) {
    NavigationRail(
        containerColor = Color.White
    ) {
        bottomNavItems.forEach { item ->
            val selected = isSelectedRoute(currentRoute, item.route)
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
                    if (item.route == NavRoutes.Profile.ROOT) {
                        ProfileNavIcon(
                            selected = selected,
                            avatarUrl = profileAvatarUrl,
                            displayName = profileDisplayName
                        )
                    } else {
                        Icon(imageVector = item.icon, contentDescription = item.label)
                    }
                },
                alwaysShowLabel = false,
                colors = NavigationRailItemDefaults.colors(
                    selectedIconColor = BrandPurple,
                    unselectedIconColor = TextMuted,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}

private fun isSelectedRoute(currentRoute: String?, itemRoute: String): Boolean {
    if (currentRoute == null) return false
    return when (itemRoute) {
        NavRoutes.Applications.ROOT ->
            currentRoute.startsWith(NavRoutes.Applications.ROOT) ||
                currentRoute.startsWith("career/applications")
        NavRoutes.Resumes.ROOT ->
            currentRoute.startsWith(NavRoutes.Resumes.ROOT) ||
                currentRoute.startsWith("career/resumes")
        else -> currentRoute.startsWith(itemRoute)
    }
}

@Composable
private fun ProfileNavIcon(
    selected: Boolean,
    avatarUrl: String?,
    displayName: String
) {
    val iconSize = 26.dp
    Box(
        modifier = Modifier
            .size(iconSize)
            .clip(CircleShape)
            .border(
                width = if (selected) 2.dp else 0.dp,
                color = if (selected) BrandPurple else Color.Transparent,
                shape = CircleShape
            )
            .background(if (selected) White else PurpleTint),
        contentAlignment = Alignment.Center
    ) {
        if (!avatarUrl.isNullOrBlank()) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = displayName,
                modifier = Modifier
                    .size(iconSize - 2.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        } else {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = displayName,
                tint = if (selected) BrandPurple else TextMuted
            )
        }
    }
}
