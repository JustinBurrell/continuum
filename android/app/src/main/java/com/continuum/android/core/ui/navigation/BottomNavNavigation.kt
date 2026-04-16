package com.continuum.android.core.ui.navigation

import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination

fun isSelectedRoute(currentRoute: String?, itemRoute: String): Boolean {
    if (currentRoute == null) return false
    return when (itemRoute) {
        NavRoutes.Dashboard.ROOT ->
            currentRoute.startsWith(NavRoutes.Dashboard.ROOT)
        NavRoutes.Career.ROOT ->
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
        NavRoutes.Career.ROOT -> NavRoutes.Career.ROOT
        else -> null
    }
    is NavItem.LogoItem -> NavRoutes.Dashboard.ROOT
    is NavItem.ProfileItem -> NavRoutes.Profile.ROOT
}

private fun NavItem.tabStartRoute(): String? = when (this) {
    is NavItem.IconItem -> when (itemRoute) {
        NavRoutes.Notes.ROOT -> NavRoutes.Notes.LIST
        NavRoutes.Flashcards.ROOT -> NavRoutes.Flashcards.LIST
        NavRoutes.Career.ROOT -> NavRoutes.Career.APPLICATIONS_LIST
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
            NavRoutes.Career.ROOT -> currentRoute == NavRoutes.Career.APPLICATIONS_LIST
            else -> false
        }
        is NavItem.LogoItem -> currentRoute == NavRoutes.Dashboard.SCREEN
        is NavItem.ProfileItem -> currentRoute == NavRoutes.Profile.SCREEN
    }
}

fun NavController.handleBottomNavItemClick(item: NavItem, currentRoute: String?) {
    // Always navigate to the tab's start route — never restore state.
    // Tapping a tab that is already at its root is a no-op; tapping any other tab
    // (or tapping the current tab while deep inside it) always pops back to root.
    if (isBottomNavTabAtRoot(currentRoute, item)) return
    val startRoute = item.tabStartRoute() ?: item.route
    navigate(startRoute) {
        popUpTo(graph.findStartDestination().id) { inclusive = false }
        launchSingleTop = true
    }
}
