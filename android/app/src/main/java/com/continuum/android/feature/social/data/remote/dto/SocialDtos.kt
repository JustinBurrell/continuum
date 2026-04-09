package com.continuum.android.feature.social.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ActivityItemDto(
    @Json(name = "_id") val id: String = "",
    val type: String = "",           // "note_shared" | "flashcard_shared" | "task_created" | "friend_accepted"
    val actorName: String = "",
    val actorAvatar: String? = null,
    val resourceId: String? = null,
    val resourceTitle: String? = null,
    val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class ActivityResponseDto(
    val success: Boolean = false,
    val data: List<ActivityItemDto> = emptyList(),
    val nextCursor: String? = null
)

@JsonClass(generateAdapter = true)
data class FriendDto(
    @Json(name = "_id") val id: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val username: String? = null,
    val avatar: String? = null,
    val mutualFriendsCount: Int = 0
)

@JsonClass(generateAdapter = true)
data class FriendRequestDto(
    @Json(name = "_id") val id: String = "",
    val sender: FriendDto = FriendDto(),
    val receiver: FriendDto = FriendDto(),
    val status: String = "pending"
)

@JsonClass(generateAdapter = true)
data class FriendsResponseDto(
    val success: Boolean = false,
    val data: List<FriendDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class FriendRequestsResponseDto(
    val success: Boolean = false,
    val data: List<FriendRequestDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class UserSearchDto(
    @Json(name = "_id") val id: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val username: String? = null,
    val avatar: String? = null,
    val friendStatus: String = "none" // "none" | "pending" | "friends"
)

@JsonClass(generateAdapter = true)
data class UserSearchResponseDto(
    val success: Boolean = false,
    val data: List<UserSearchDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class CommentDto(
    @Json(name = "_id") val id: String = "",
    val authorName: String = "",
    val authorAvatar: String? = null,
    val content: String = "",
    val likes: Int = 0,
    val replies: List<CommentDto> = emptyList(),
    val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class NoteWithCommentsDto(
    @Json(name = "_id") val id: String = "",
    val title: String = "",
    val content: String = "",
    val comments: List<CommentDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class NoteWithCommentsResponseDto(
    val success: Boolean = false,
    val data: NoteWithCommentsDto = NoteWithCommentsDto()
)

@JsonClass(generateAdapter = true)
data class AddCommentRequestDto(val content: String)

@JsonClass(generateAdapter = true)
data class SendFriendRequestDto(val receiverId: String)
