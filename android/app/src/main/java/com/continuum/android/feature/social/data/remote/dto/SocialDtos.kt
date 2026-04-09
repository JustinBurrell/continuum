package com.continuum.android.feature.social.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class SocialUserSummaryDto(
    @Json(name = "_id") val id: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val username: String? = null,
    @Json(name = "avatarUrl") val avatarUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class ActivityMetadataDto(
    val noteTitle: String? = null,
    val setTitle: String? = null,
    val taskTitle: String? = null,
    val commentPreview: String? = null
)

@JsonClass(generateAdapter = true)
data class ActivityFeedItemDto(
    @Json(name = "_id") val id: String = "",
    val type: String = "",
    val targetId: String? = null,
    val targetType: String? = null,
    val userId: SocialUserSummaryDto? = null,
    val metadata: ActivityMetadataDto? = null,
    val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class ActivityResponseDto(
    val success: Boolean = false,
    val feed: List<ActivityFeedItemDto> = emptyList(),
    val nextCursor: String? = null,
    val total: Int = 0
)

@JsonClass(generateAdapter = true)
data class FriendshipJsonDto(
    @Json(name = "_id") val id: String = "",
    val user1: SocialUserSummaryDto? = null,
    val user2: SocialUserSummaryDto? = null,
    val requestedBy: String? = null,
    val status: String = ""
)

@JsonClass(generateAdapter = true)
data class FriendsListResponseDto(
    val success: Boolean = false,
    val friends: List<FriendshipJsonDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class UserSearchDto(
    @Json(name = "_id") val id: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val username: String? = null,
    @Json(name = "avatarUrl") val avatar: String? = null,
    val friendStatus: String = "none"
)

@JsonClass(generateAdapter = true)
data class UserSearchResponseDto(
    val success: Boolean = false,
    val users: List<UserSearchDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class UserSnapshotDto(
    val username: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val avatarUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class CommentJsonDto(
    @Json(name = "_id") val id: String = "",
    val content: String = "",
    val userSnapshot: UserSnapshotDto? = null,
    val likes: List<String> = emptyList(),
    val parentId: String? = null,
    val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class CommentsListResponseDto(
    val success: Boolean = false,
    val comments: List<CommentJsonDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class CreateCommentRequestDto(
    val targetId: String,
    val targetType: String = "note",
    val content: String
)

@JsonClass(generateAdapter = true)
data class SendFriendRequestDto(val recipientId: String)

@JsonClass(generateAdapter = true)
data class FriendRequestActionDto(val action: String)
