package com.continuum.android.core.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
import com.continuum.android.core.ui.theme.BrandPurple
import com.continuum.android.core.ui.theme.TextPrimary

@Composable
fun NotificationBell(
    unreadCount: Int,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    BadgedBox(
        badge = {
            if (unreadCount > 0) {
                Badge(containerColor = BrandPurple) {
                    androidx.compose.material3.Text(
                        text = if (unreadCount > 9) "9+" else "$unreadCount",
                        color = Color.White,
                        fontSize = 9.sp
                    )
                }
            }
        },
        modifier = modifier
    ) {
        IconButton(onClick = onClick) {
            Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = TextPrimary)
        }
    }
}
