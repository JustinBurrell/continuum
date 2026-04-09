package com.continuum.android.feature.social.data.repository

import com.continuum.android.feature.social.data.remote.SocialApiService
import com.continuum.android.feature.social.data.remote.dto.*
import com.continuum.android.feature.social.domain.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SocialRepository @Inject constructor(private val api: SocialApiService) {

    suspend fun getActivity(cursor: String? = null): Result<Pair<List<ActivityItem>, String?>> = runCatching {
        val resp = api.getActivity(cursor)
        Pair(resp.data.map { it.toDomain() }, resp.nextCursor)
    }

    suspend fun getFriends(): Result<List<Friend>> = runCatching {
        api.getFriends().data.map { it.toDomain() }
    }

    suspend fun getFriendRequests(): Result<List<FriendRequest>> = runCatching {
        api.getFriendRequests().data.map { it.toDomain() }
    }

    suspend fun sendFriendRequest(userId: String): Result<Unit> = runCatching {
        api.sendFriendRequest(SendFriendRequestDto(userId))
        Unit
    }

    suspend fun acceptFriendRequest(requestId: String): Result<Unit> = runCatching {
        api.acceptFriendRequest(requestId)
        Unit
    }

    suspend fun declineFriendRequest(requestId: String): Result<Unit> = runCatching {
        api.declineFriendRequest(requestId)
        Unit
    }

    suspend fun removeFriend(userId: String): Result<Unit> = runCatching {
        api.removeFriend(userId)
        Unit
    }

    suspend fun searchUsers(query: String): Result<List<UserSearchResult>> = runCatching {
        api.searchUsers(query).data.map { it.toDomain() }
    }

    suspend fun getSharedNote(noteId: String): Result<SharedNote> = runCatching {
        api.getSharedNote(noteId).data.toDomain()
    }

    suspend fun addComment(noteId: String, content: String): Result<Unit> = runCatching {
        api.addComment(noteId, AddCommentRequestDto(content))
        Unit
    }

    suspend fun likeComment(noteId: String, commentId: String): Result<Unit> = runCatching {
        api.likeComment(noteId, commentId)
        Unit
    }

    // Mappers
    private fun ActivityItemDto.toDomain() = ActivityItem(id, type, actorName, actorAvatar, resourceId, resourceTitle, createdAt)
    private fun FriendDto.toDomain() = Friend(id, firstName, lastName, username, avatar, mutualFriendsCount)
    private fun FriendRequestDto.toDomain() = FriendRequest(id, sender.toDomain(), receiver.toDomain(), status)
    private fun UserSearchDto.toDomain() = UserSearchResult(id, firstName, lastName, username, avatar, friendStatus)
    private fun CommentDto.toDomain(): Comment = Comment(id, authorName, authorAvatar, content, likes, replies.map { it.toDomain() }, createdAt)
    private fun NoteWithCommentsDto.toDomain() = SharedNote(id, title, content, comments.map { it.toDomain() })
}
