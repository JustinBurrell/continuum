package com.continuum.android.core.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.continuum.android.R
import com.continuum.android.core.ui.theme.*

/**
 * Instagram-style top header for the Dashboard screen.
 * Shows the Continuum wordmark on the left and action icons on the right.
 * Light background, no purple bar.
 */
@Composable
fun ContinuumTopHeader(
    onCalendarClick: () -> Unit = {},
    onActivityClick: () -> Unit = {},
    onMessagesClick: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    Surface(
        color = White,
        shadowElevation = 1.dp,
        modifier = modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Spacing.lg, vertical = Spacing.sm),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    painter = painterResource(R.drawable.ic_logo_symbol),
                    contentDescription = "Continuum",
                    tint = BrandPurple,
                    modifier = Modifier.size(24.dp),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = "continuum",
                    fontFamily = FrauncesFamily,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = TextPrimary,
                )
            }

            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                IconButton(onClick = onCalendarClick) {
                    Icon(Icons.Default.CalendarMonth, "Calendar", tint = TextPrimary)
                }
                IconButton(onClick = onActivityClick) {
                    Icon(Icons.Default.Notifications, "Activity", tint = TextPrimary)
                }
                IconButton(onClick = onMessagesClick) {
                    Icon(Icons.Default.ChatBubbleOutline, "Messages", tint = TextPrimary)
                }
            }
        }
    }
}
