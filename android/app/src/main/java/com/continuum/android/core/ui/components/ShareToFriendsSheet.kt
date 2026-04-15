package com.continuum.android.core.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.social.domain.Friend

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShareToFriendsSheet(
    friends: List<Friend>,
    isLoadingFriends: Boolean,
    isSharing: Boolean,
    onDismiss: () -> Unit,
    onShare: (List<String>) -> Unit
) {
    var selected by remember { mutableStateOf(emptySet<String>()) }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = SurfaceWhite) {
        Column(modifier = Modifier.padding(horizontal = 16.dp).padding(bottom = 24.dp)) {
            Text(
                "Share with friends",
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary,
                modifier = Modifier.padding(bottom = 12.dp)
            )
            when {
                isLoadingFriends -> {
                    repeat(3) {
                        SkeletonLoader(modifier = Modifier.fillMaxWidth().height(56.dp).padding(vertical = 4.dp))
                    }
                }
                friends.isEmpty() -> {
                    Text(
                        "No friends yet. Add friends first.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextMuted
                    )
                }
                else -> {
                    LazyColumn(modifier = Modifier.heightIn(max = 320.dp)) {
                        items(friends, key = { it.userId }) { friend ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selected = if (friend.userId in selected) {
                                            selected - friend.userId
                                        } else {
                                            selected + friend.userId
                                        }
                                    }
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Checkbox(
                                    checked = friend.userId in selected,
                                    onCheckedChange = { checked ->
                                        selected = if (checked) {
                                            selected + friend.userId
                                        } else {
                                            selected - friend.userId
                                        }
                                    },
                                    colors = CheckboxDefaults.colors(checkedColor = BrandPurple)
                                )
                                AvatarInitials(name = friend.fullName, modifier = Modifier.size(36.dp))
                                Column {
                                    Text(
                                        friend.fullName,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = TextPrimary
                                    )
                                    friend.username?.takeIf { it.isNotBlank() }?.let {
                                        Text(
                                            "@$it",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextMuted
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(16.dp))
            ContinuumButton(
                text = if (isSharing) "Sharing…" else "Share${if (selected.isNotEmpty()) " with ${selected.size}" else ""}",
                onClick = { if (selected.isNotEmpty() && !isSharing) onShare(selected.toList()) },
                modifier = Modifier.fillMaxWidth(),
                enabled = selected.isNotEmpty() && !isSharing
            )
        }
    }
}
