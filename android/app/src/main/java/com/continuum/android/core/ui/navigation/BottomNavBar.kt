package com.continuum.android.core.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.MenuBook
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.key
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import androidx.navigation.NavController
import com.continuum.android.R
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.PurpleTint
import com.continuum.android.core.ui.theme.TextMuted
import com.continuum.android.core.ui.theme.White

sealed class NavItem(val route: String, val contentDescription: String) {
    data class IconItem(
        val itemRoute: String,
        val description: String,
        val icon: ImageVector,
    ) : NavItem(itemRoute, description)

    data class LogoItem(
        val itemRoute: String,
    ) : NavItem(itemRoute, "Dashboard")

    data class ProfileItem(
        val itemRoute: String,
    ) : NavItem(itemRoute, "Profile")
}

val bottomNavItems: List<NavItem> = listOf(
    NavItem.IconItem(NavRoutes.Notes.ROOT, "Notes", Icons.AutoMirrored.Filled.MenuBook),
    NavItem.IconItem(NavRoutes.Flashcards.ROOT, "Flashcards", Icons.Default.Style),
    NavItem.LogoItem(NavRoutes.Dashboard.ROOT),
    NavItem.IconItem(NavRoutes.Applications.ROOT, "Applications", Icons.Default.Work),
    NavItem.ProfileItem(NavRoutes.Profile.ROOT),
)

@Composable
fun ContinuumBottomBar(
    currentRoute: String?,
    navController: NavController,
    profileAvatarUrl: String? = null,
    profileDisplayName: String = "Profile",
    profileImageCacheKey: String? = null,
) {
    NavigationBar(
        containerColor = White,
        tonalElevation = 0.dp
    ) {
        bottomNavItems.forEach { item ->
            val selected = isSelectedRoute(currentRoute, item.route)
            NavigationBarItem(
                selected = selected,
                onClick = { navController.handleBottomNavItemClick(item, currentRoute) },
                icon = {
                    when (item) {
                        is NavItem.IconItem -> Icon(
                            imageVector = item.icon,
                            contentDescription = item.contentDescription,
                        )
                        is NavItem.LogoItem -> Icon(
                            painter = painterResource(R.drawable.ic_logo_symbol),
                            contentDescription = "Dashboard",
                            tint = if (selected) BrandPurple else TextMuted,
                            modifier = Modifier.size(28.dp),
                        )
                        is NavItem.ProfileItem -> ProfileNavIcon(
                            selected = selected,
                            avatarUrl = profileAvatarUrl,
                            displayName = profileDisplayName,
                            imageCacheKey = profileImageCacheKey,
                        )
                    }
                },
                alwaysShowLabel = false,
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = BrandPurple,
                    unselectedIconColor = TextMuted,
                    indicatorColor = Color.Transparent,
                ),
            )
        }
    }
}

@Composable
fun ContinuumNavigationRail(
    currentRoute: String?,
    navController: NavController,
    profileAvatarUrl: String? = null,
    profileDisplayName: String = "Profile",
    profileImageCacheKey: String? = null,
) {
    NavigationRail(containerColor = White) {
        bottomNavItems.forEach { item ->
            val selected = isSelectedRoute(currentRoute, item.route)
            NavigationRailItem(
                selected = selected,
                onClick = { navController.handleBottomNavItemClick(item, currentRoute) },
                icon = {
                    when (item) {
                        is NavItem.IconItem -> Icon(
                            imageVector = item.icon,
                            contentDescription = item.contentDescription,
                        )
                        is NavItem.LogoItem -> Icon(
                            painter = painterResource(R.drawable.ic_logo_symbol),
                            contentDescription = "Dashboard",
                            tint = if (selected) BrandPurple else TextMuted,
                            modifier = Modifier.size(28.dp),
                        )
                        is NavItem.ProfileItem -> ProfileNavIcon(
                            selected = selected,
                            avatarUrl = profileAvatarUrl,
                            displayName = profileDisplayName,
                            imageCacheKey = profileImageCacheKey,
                        )
                    }
                },
                alwaysShowLabel = false,
                colors = NavigationRailItemDefaults.colors(
                    selectedIconColor = BrandPurple,
                    unselectedIconColor = TextMuted,
                    indicatorColor = Color.Transparent,
                ),
            )
        }
    }
}

@Composable
private fun ProfileNavIcon(
    selected: Boolean,
    avatarUrl: String?,
    displayName: String,
    imageCacheKey: String? = null,
) {
    val iconSize = 26.dp
    Box(
        modifier = Modifier
            .size(iconSize)
            .clip(CircleShape)
            .border(
                width = if (selected) 2.dp else 0.dp,
                color = if (selected) BrandPurple else Color.Transparent,
                shape = CircleShape,
            )
            .background(if (selected) White else PurpleTint),
        contentAlignment = Alignment.Center,
    ) {
        if (!avatarUrl.isNullOrBlank()) {
            key(imageCacheKey, avatarUrl) {
                AsyncImage(
                    model = avatarUrl,
                    contentDescription = displayName,
                    modifier = Modifier
                        .size(iconSize - 2.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop,
                )
            }
        } else {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = displayName,
                tint = if (selected) BrandPurple else TextMuted,
            )
        }
    }
}
