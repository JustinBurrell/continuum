package com.continuum.android.core.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
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
    onShare: (visibility: String, sharedWith: List<String>) -> Unit
) {
    var visibility by remember { mutableStateOf("private") }
    var selected by remember { mutableStateOf(emptySet<String>()) }
    var searchQuery by remember { mutableStateOf("") }

    val filteredFriends = remember(friends, searchQuery) {
        if (searchQuery.isBlank()) friends
        else friends.filter {
            it.fullName.contains(searchQuery, ignoreCase = true) ||
                it.username?.contains(searchQuery, ignoreCase = true) == true
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = SurfaceWhite
    ) {
        Column(
            modifier = Modifier
                .padding(horizontal = 16.dp)
                .padding(bottom = 24.dp)
                .imePadding()
        ) {
            Text(
                "Share",
                style = MaterialTheme.typography.titleMedium,
                color = TextPrimary,
                modifier = Modifier.padding(bottom = 12.dp)
            )

            Text(
                "VISIBILITY",
                style = MaterialTheme.typography.labelSmall,
                color = TextMuted,
                modifier = Modifier.padding(bottom = 8.dp)
            )

            listOf(
                Triple("private", "Private", "Only you can see this"),
                Triple("friends", "All Friends", "Visible to all your friends"),
                Triple("specific", "Specific Friends", "Choose who can see this")
            ).forEach { (value, label, desc) ->
                Surface(
                    onClick = { visibility = value },
                    shape = RoundedCornerShape(12.dp),
                    border = if (visibility == value) BorderStroke(1.5.dp, BrandPurple) else BorderStroke(1.dp, Border),
                    color = if (visibility == value) PurpleTint else White,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 3.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        RadioButton(
                            selected = visibility == value,
                            onClick = { visibility = value },
                            colors = RadioButtonDefaults.colors(selectedColor = BrandPurple)
                        )
                        Column {
                            Text(label, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                            Text(desc, style = MaterialTheme.typography.bodySmall, color = TextMuted)
                        }
                    }
                }
            }

            if (visibility == "specific") {
                Spacer(Modifier.height(12.dp))

                Text(
                    "SELECT FRIENDS",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted,
                    modifier = Modifier.padding(bottom = 8.dp)
                )

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search friends...") },
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = TextSecondary) },
                    trailingIcon = {
                        if (searchQuery.isNotBlank()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Close, null, tint = TextSecondary)
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandPurple,
                        unfocusedBorderColor = Border
                    )
                )

                when {
                    isLoadingFriends -> {
                        repeat(3) {
                            SkeletonLoader(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(56.dp)
                                    .padding(vertical = 4.dp)
                            )
                        }
                    }
                    filteredFriends.isEmpty() -> {
                        Text(
                            if (searchQuery.isBlank()) "No friends yet. Add friends first." else "No friends match your search.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextMuted,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    }
                    else -> {
                        LazyColumn(modifier = Modifier.heightIn(max = 240.dp)) {
                            items(filteredFriends, key = { it.userId }) { friend ->
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
                                            selected = if (checked) selected + friend.userId else selected - friend.userId
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

                if (selected.isNotEmpty()) {
                    Text(
                        "${selected.size} friend${if (selected.size != 1) "s" else ""} selected",
                        style = MaterialTheme.typography.labelSmall,
                        color = BrandPurple,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            ContinuumButton(
                text = when {
                    isSharing -> "Sharing\u2026"
                    visibility == "specific" -> "Share${if (selected.isNotEmpty()) " with ${selected.size}" else ""}"
                    visibility == "friends" -> "Share with all friends"
                    else -> "Save as private"
                },
                onClick = {
                    if (!isSharing) {
                        val sharedWith = if (visibility == "specific") selected.toList() else emptyList()
                        onShare(visibility, sharedWith)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isSharing && (visibility != "specific" || selected.isNotEmpty())
            )
        }
    }
}
