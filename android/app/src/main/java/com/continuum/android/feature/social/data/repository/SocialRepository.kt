package com.continuum.android.feature.social.data.repository

import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.flashcards.data.remote.FlashcardsApiService
import com.continuum.android.feature.notes.data.remote.NotesApiService
import com.continuum.android.feature.social.data.remote.SocialApiService
import com.continuum.android.feature.tasks.data.remote.TasksApiService
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import com.continuum.android.feature.social.data.remote.dto.*
import com.continuum.android.feature.social.domain.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SocialRepository @Inject constructor(
    private val api: SocialApiService,
    private val notesApi: NotesApiService,
    private val tasksApi: TasksApiService,
    private val flashcardsApi: FlashcardsApiService,
    private val tokenManager: TokenManager
) {

    private fun meId(): String =
        tokenManager.getJwtUserId() ?: error("Not signed in")

    suspend fun getActivity(cursor: String? = null): Result<Pair<List<ActivityItem>, String?>> = runCatching {
        val resp = api.getActivity(cursor)
        Pair(resp.feed.map { it.toDomain() }, resp.nextCursor)
    }

    suspend fun markActivitySeen(): Result<Unit> = runCatching {
        api.markActivitySeen()
        Unit
    }

    suspend fun getFriends(): Result<List<Friend>> = runCatching {
        val me = meId()
        api.getFriends(null).friends.mapNotNull { it.toFriend(me) }
    }

    suspend fun getFriendRequests(): Result<List<FriendRequest>> = runCatching {
        val me = meId()
        api.getFriends("pending").friends.mapNotNull { it.toIncomingRequest(me) }
    }

    suspend fun getSentRequests(): Result<List<FriendRequest>> = runCatching {
        val me = meId()
        api.getFriends("sent").friends.mapNotNull { it.toSentRequest(me) }
    }

    suspend fun cancelFriendRequest(requestId: String): Result<Unit> = runCatching {
        api.cancelFriendRequest(requestId)
        Unit
    }

    suspend fun sendFriendRequest(userId: String): Result<Unit> = runCatching {
        api.sendFriendRequest(SendFriendRequestDto(userId))
        Unit
    }

    suspend fun acceptFriendRequest(requestId: String): Result<Unit> = runCatching {
        api.respondToFriendRequest(requestId, FriendRequestActionDto("accept"))
        Unit
    }

    suspend fun declineFriendRequest(requestId: String): Result<Unit> = runCatching {
        api.respondToFriendRequest(requestId, FriendRequestActionDto("decline"))
        Unit
    }

    suspend fun removeFriend(friendshipId: String): Result<Unit> = runCatching {
        api.removeFriend(friendshipId)
        Unit
    }

    suspend fun searchUsers(query: String): Result<List<UserSearchResult>> = runCatching {
        api.searchUsers(query).users.map { it.toDomain() }
    }

    suspend fun searchFriendsForMention(query: String): List<UserSearchResult> = runCatching {
        if (query.isBlank()) api.searchFriendsAll().users.map { it.toDomain() }
        else api.searchFriends(query).users.map { it.toDomain() }
    }.getOrDefault(emptyList())

    suspend fun lookupUserByUsername(username: String): List<UserSearchResult> = runCatching {
        api.lookupByUsername(username).users.map { it.toDomain() }
    }.getOrDefault(emptyList())

    suspend fun getSharedNote(noteId: String): Result<SharedNote> = runCatching {
        val note = notesApi.getNoteById(noteId).note
        val flat = api.getComments("note", noteId).comments
        SharedNote(
            id = note.id,
            title = note.title,
            content = note.content,
            comments = flat.toNestedComments(),
            ownerName = note.owner?.displayName,
            ownerUserId = note.owner?.id?.takeIf { it.isNotBlank() },
            hasFlashcards = note.hasFlashcards
        )
    }

    suspend fun getCommentsForTarget(targetType: String, targetId: String): Result<List<Comment>> = runCatching {
        api.getComments(targetType, targetId).comments.toNestedComments()
    }

    suspend fun addComment(noteId: String, content: String): Result<Unit> = runCatching {
        api.createComment(CreateCommentRequestDto(targetId = noteId, targetType = "note", content = content))
        Unit
    }

    suspend fun addCommentGeneric(targetType: String, targetId: String, content: String, parentId: String? = null): Result<Unit> = runCatching {
        api.createComment(CreateCommentRequestDto(targetId = targetId, targetType = targetType, content = content, parentId = parentId))
        Unit
    }

    suspend fun likeComment(commentId: String): Result<Unit> = runCatching {
        api.toggleCommentLike(commentId)
        Unit
    }

    suspend fun deleteComment(commentId: String): Result<Unit> = runCatching {
        api.deleteComment(commentId)
        Unit
    }

    /**
     * Loads shared notes / tasks / sets visible to the current user and filters to items
     * owned by [profileUserId], plus up to [activityLimit] activity feed rows for that actor.
     */
    suspend fun getFriendProfileExtras(profileUserId: String, activityLimit: Int = 8): Result<FriendProfileExtras> =
        runCatching {
            coroutineScope {
                val notesJob = async { notesApi.getSharedNotes() }
                val tasksJob = async { tasksApi.getSharedTasks() }
                val setsJob = async { flashcardsApi.getSharedSets() }
                val activityJob = async { api.getActivity(null) }

                val sharedNotes = notesJob.await().notes.mapNotNull { dto ->
                    val owner = dto.owner?.id?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
                    if (owner != profileUserId) return@mapNotNull null
                    FriendSharedNoteSummary(
                        id = dto.id,
                        title = dto.title,
                        type = dto.type?.ifBlank { "general" } ?: "general"
                    )
                }

                val sharedTasks = tasksJob.await().tasks.mapNotNull { dto ->
                    val owner = dto.userId?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
                    if (owner != profileUserId) return@mapNotNull null
                    FriendSharedTaskSummary(id = dto.id, title = dto.title, status = dto.status)
                }

                val sharedSets = setsJob.await().sets.mapNotNull { dto ->
                    val owner = dto.owner?.id?.takeIf { it.isNotBlank() } ?: return@mapNotNull null
                    if (owner != profileUserId) return@mapNotNull null
                    FriendSharedSetSummary(
                        id = dto.id,
                        title = dto.title,
                        cardCount = dto.resolvedCardCount()
                    )
                }

                val recentActivity = activityJob.await().feed
                    .map { it.toDomain() }
                    .filter { it.actorId == profileUserId }
                    .take(activityLimit)

                FriendProfileExtras(
                    sharedNotes = sharedNotes,
                    sharedTasks = sharedTasks,
                    sharedSets = sharedSets,
                    recentActivity = recentActivity
                )
            }
        }

    suspend fun getUserProfile(userId: String): Result<UserProfile> = runCatching {
        val dto = api.getUserProfile(userId).user
        val streak = runCatching { api.getUserStreak(userId).streak }.getOrElse { dto.streak }
        val friends = getFriends().getOrDefault(emptyList())
        val friendEntry = friends.find { it.userId == userId }
        val incoming = getFriendRequests().getOrDefault(emptyList()).find { it.sender.userId == userId }
        val outgoing = getSentRequests().getOrDefault(emptyList()).find { it.receiver.userId == userId }
        val status = when {
            friendEntry != null -> "friends"
            incoming != null -> "pending_incoming"
            outgoing != null -> "pending_outgoing"
            else -> "none"
        }
        UserProfile(
            id = dto.id,
            firstName = dto.firstName,
            lastName = dto.lastName,
            username = dto.username,
            avatarUrl = dto.avatarUrl,
            bio = dto.bio,
            linkedinUrl = dto.linkedinUrl,
            instagramHandle = dto.instagramHandle,
            createdAt = dto.createdAt,
            roles = dto.roles,
            friendStatus = status,
            friendshipId = friendEntry?.id,
            incomingRequestId = incoming?.id,
            outgoingRequestId = outgoing?.id,
            notesCount = dto.notesCount,
            setsCount = dto.setsCount,
            streak = streak
        )
    }

    private fun ActivityFeedItemDto.toDomain(): ActivityItem {
        val u = userId
        val actorName = when {
            u == null -> "Someone"
            u.firstName.isNotBlank() || u.lastName.isNotBlank() -> "${u.firstName} ${u.lastName}".trim()
            else -> u.username ?: "Someone"
        }
        val meta = metadata
        val title = meta?.noteTitle ?: meta?.setTitle ?: meta?.taskTitle ?: meta?.commentPreview
        return ActivityItem(
            id = id,
            type = type,
            actorId = u?.id,
            actorName = actorName,
            actorAvatar = u?.avatarUrl,
            actorRoles = u?.roles ?: emptyList(),
            resourceId = targetId,
            resourceTitle = title,
            createdAt = createdAt
        )
    }

    private fun FriendshipJsonDto.toFriend(meId: String): Friend? {
        val a = user1 ?: return null
        val b = user2 ?: return null
        val other = if (a.id == meId) b else a
        return Friend(
            id = id,
            userId = other.id,
            firstName = other.firstName,
            lastName = other.lastName,
            username = other.username,
            avatar = other.avatarUrl,
            mutualFriendsCount = 0,
            roles = other.roles
        )
    }

    private fun FriendshipJsonDto.toIncomingRequest(meId: String): FriendRequest? {
        val senderId = requestedBy ?: return null
        val senderUser = when {
            user1?.id == senderId -> user1
            user2?.id == senderId -> user2
            else -> return null
        }
        val receiverUser = when {
            user1?.id == meId -> user1
            user2?.id == meId -> user2
            else -> return null
        }
        return FriendRequest(
            id = id,
            sender = senderUser.toFriend(),
            receiver = receiverUser.toFriend(),
            status = status
        )
    }

    private fun FriendshipJsonDto.toSentRequest(meId: String): FriendRequest? {
        val senderId = requestedBy ?: return null
        if (senderId != meId) return null
        val receiverUser = when {
            user1?.id != meId -> user1
            user2?.id != meId -> user2
            else -> return null
        } ?: return null
        val senderUser = when {
            user1?.id == meId -> user1
            user2?.id == meId -> user2
            else -> return null
        } ?: return null
        return FriendRequest(
            id = id,
            sender = senderUser.toFriend(),
            receiver = receiverUser.toFriend(),
            status = status
        )
    }

    private fun SocialUserSummaryDto.toFriend() = Friend(
        id = id,
        userId = id,
        firstName = firstName,
        lastName = lastName,
        username = username,
        avatar = avatarUrl,
        mutualFriendsCount = 0,
        roles = roles
    )

    private fun UserSearchDto.toDomain() = UserSearchResult(
        id = id,
        firstName = firstName,
        lastName = lastName,
        username = username,
        avatar = avatar,
        friendStatus = friendStatus
    )

    private fun CommentJsonDto.toDomain(replies: List<Comment>): Comment {
        val snap = userSnapshot
        val fn = snap?.firstName.orEmpty()
        val ln = snap?.lastName.orEmpty()
        val authorName = when {
            snap == null -> "Someone"
            fn.isNotBlank() || ln.isNotBlank() ->
                listOf(fn, ln).filter { it.isNotBlank() }.joinToString(" ")
            else -> snap.username?.takeIf { it.isNotBlank() } ?: "Someone"
        }
        return Comment(
            id = id,
            authorId = userId,
            authorName = authorName,
            authorUsername = snap?.username,
            authorAvatar = snap?.avatarUrl,
            authorRoles = snap?.roles ?: emptyList(),
            content = content,
            likes = likes.size,
            replies = replies,
            createdAt = createdAt
        )
    }

    private fun List<CommentJsonDto>.toNestedComments(): List<Comment> {
        val byParent = groupBy { it.parentId }
        fun build(parentKey: String?): List<Comment> {
            val children = byParent[parentKey].orEmpty()
            return children.map { j ->
                j.toDomain(build(j.id))
            }
        }
        return build(null)
    }
}
