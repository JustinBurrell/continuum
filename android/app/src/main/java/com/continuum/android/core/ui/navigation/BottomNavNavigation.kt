package com.continuum.android.core.ui.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination

fun isSelectedRoute(currentRoute: String?, itemRoute: String): Boolean {
    if (currentRoute == null) return false
    return when (itemRoute) {
        NavRoutes.Dashboard.ROOT ->
            currentRoute.startsWith(NavRoutes.Dashboard.ROOT)
        NavRoutes.Applications.ROOT ->
            currentRoute.startsWith(NavRoutes.Applications.ROOT) ||
                currentRoute.startsWith(NavRoutes.Career.ROOT)
        NavRoutes.Profile.ROOT ->
            currentRoute.startsWith(NavRoutes.Profile.ROOT)
        else -> currentRoute.startsWith(itemRoute)
    }
}

private fun NavItem.tabGraphRoute(): String? = when (this) {
    is NavItem.IconItem -> when (itemRoute) {
        NavRoutes.Notes.ROOT -> NavRoutes.Notes.ROOT
        NavRoutes.Flashcards.ROOT -> NavRoutes.Flashcards.ROOT
        NavRoutes.Applications.ROOT -> NavRoutes.Applications.ROOT
        else -> null
    }
    is NavItem.LogoItem -> NavRoutes.Dashboard.ROOT
    is NavItem.ProfileItem -> NavRoutes.Profile.ROOT
}

private fun NavItem.tabStartRoute(): String? = when (this) {
    is NavItem.IconItem -> when (itemRoute) {
        NavRoutes.Notes.ROOT -> NavRoutes.Notes.LIST
        NavRoutes.Flashcards.ROOT -> NavRoutes.Flashcards.LIST
        NavRoutes.Applications.ROOT -> NavRoutes.Applications.LIST
        else -> null
    }
    is NavItem.LogoItem -> NavRoutes.Dashboard.SCREEN
    is NavItem.ProfileItem -> NavRoutes.Profile.SCREEN
}

fun isBottomNavTabAtRoot(currentRoute: String?, item: NavItem): Boolean {
    if (currentRoute == null) return true
    return when (item) {
        is NavItem.IconItem -> when (item.itemRoute) {
            NavRoutes.Notes.ROOT -> currentRoute == NavRoutes.Notes.LIST
            NavRoutes.Flashcards.ROOT -> currentRoute == NavRoutes.Flashcards.LIST
            NavRoutes.Applications.ROOT -> currentRoute == NavRoutes.Applications.LIST
            else -> false
        }
        is NavItem.LogoItem -> currentRoute == NavRoutes.Dashboard.SCREEN
        is NavItem.ProfileItem -> currentRoute == NavRoutes.Profile.SCREEN
    }
}

fun NavController.handleBottomNavItemClick(item: NavItem, currentRoute: String?) {
    val selected = isSelectedRoute(currentRoute, item.route)
    if (!selected) {
        navigate(item.route) {
            popUpTo(graph.findStartDestination().id) {
                inclusive = false
                saveState = true
            }
            launchSingleTop = true
            restoreState = true
        }
        return
    }
    if (isBottomNavTabAtRoot(currentRoute, item)) return

    if (item is NavItem.IconItem && item.itemRoute == NavRoutes.Applications.ROOT &&
        currentRoute != null && currentRoute.startsWith(NavRoutes.Career.ROOT)
    ) {
        navigate(NavRoutes.Applications.ROOT) {
            popUpTo(graph.findStartDestination().id) {
                inclusive = false
                saveState = true
            }
            launchSingleTop = true
            restoreState = true
        }
        return
    }

    val graphRoute = item.tabGraphRoute() ?: return
    val startRoute = item.tabStartRoute() ?: return
    navigate(startRoute) {
        popUpTo(graphRoute) {
            inclusive = false
            saveState = true
        }
        launchSingleTop = true
    }
}
