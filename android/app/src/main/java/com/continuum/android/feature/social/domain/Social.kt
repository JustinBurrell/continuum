package com.continuum.android.feature.social.domain

data class ActivityItem(
    val id: String,
    val type: String,
    val actorId: String?,
    val actorName: String,
    val actorAvatar: String?,
    val resourceId: String?,
    val resourceTitle: String?,
    val createdAt: String
) {
    val displayText: String
        get() = when (type) {
            "note_shared" -> "$actorName shared a note${resourceTitle?.let { ": $it" } ?: ""}"
            "flashcard_shared" -> "$actorName shared a flashcard set${resourceTitle?.let { ": $it" } ?: ""}"
            "task_created" -> "$actorName created a task${resourceTitle?.let { ": $it" } ?: ""}"
            "comment_added" -> "$actorName commented${resourceTitle?.let { ": $it" } ?: ""}"
            "like_added" -> "$actorName liked a comment"
            "friend_accepted" -> "$actorName accepted your friend request"
            else -> "$actorName did something"
        }
}

data class Friend(
    val id: String,
    val userId: String,
    val firstName: String,
    val lastName: String,
    val username: String?,
    val avatar: String?,
    val mutualFriendsCount: Int
) {
    val fullName: String get() = "$firstName $lastName".trim()
    val initials: String get() = buildString {
        firstName.firstOrNull()?.let { append(it.uppercaseChar()) }
        lastName.firstOrNull()?.let { append(it.uppercaseChar()) }
    }
}

data class FriendRequest(
    val id: String,
    val sender: Friend,
    val receiver: Friend,
    val status: String
)

data class UserSearchResult(
    val id: String,
    val firstName: String,
    val lastName: String,
    val username: String?,
    val avatar: String?,
    val friendStatus: String // "none" | "pending" | "friends"
) {
    val fullName: String get() = "$firstName $lastName".trim()
    val initials: String get() = buildString {
        firstName.firstOrNull()?.let { append(it.uppercaseChar()) }
        lastName.firstOrNull()?.let { append(it.uppercaseChar()) }
    }
}

data class Comment(
    val id: String,
    val authorId: String?,
    val authorName: String,
    val authorAvatar: String?,
    val content: String,
    val likes: Int,
    val replies: List<Comment>,
    val createdAt: String
)

data class SharedNote(
    val id: String,
    val title: String,
    val content: String,
    val comments: List<Comment>
)

data class UserProfile(
    val id: String,
    val firstName: String,
    val lastName: String,
    val username: String?,
    val avatarUrl: String?,
    val bio: String?,
    val friendStatus: String,
    val notesCount: Int,
    val setsCount: Int,
    val streak: Int
) {
    val fullName: String get() = "$firstName $lastName".trim()
    val initials: String get() = buildString {
        firstName.firstOrNull()?.let { append(it.uppercaseChar()) }
        lastName.firstOrNull()?.let { append(it.uppercaseChar()) }
    }
}
