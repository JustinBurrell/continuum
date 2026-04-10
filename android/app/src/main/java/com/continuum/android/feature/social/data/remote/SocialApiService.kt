package com.continuum.android.feature.social.data.remote

import com.continuum.android.feature.social.data.remote.dto.*
import retrofit2.http.*

interface SocialApiService {

    @GET("activity")
    suspend fun getActivity(
        @Query("cursor") cursor: String? = null,
        @Query("limit") limit: Int? = null
    ): ActivityResponseDto

    @PUT("activity/mark-seen")
    suspend fun markActivitySeen(): retrofit2.Response<Unit>

    @GET("friends")
    suspend fun getFriends(
        @Query("status") status: String? = null,
        @Query("search") search: String? = null
    ): FriendsListResponseDto

    @DELETE("friends/request/{id}")
    suspend fun cancelFriendRequest(@Path("id") requestId: String): retrofit2.Response<Unit>

    @POST("friends/request")
    suspend fun sendFriendRequest(@Body request: SendFriendRequestDto): retrofit2.Response<Unit>

    @PUT("friends/request/{id}")
    suspend fun respondToFriendRequest(
        @Path("id") friendshipId: String,
        @Body body: FriendRequestActionDto
    ): retrofit2.Response<Unit>

    @DELETE("friends/{friendshipId}")
    suspend fun removeFriend(@Path("friendshipId") friendshipId: String): retrofit2.Response<Unit>

    @GET("users/search")
    suspend fun searchUsers(@Query("q") query: String): UserSearchResponseDto

    @GET("comments/{targetType}/{targetId}")
    suspend fun getComments(
        @Path("targetType") targetType: String,
        @Path("targetId") targetId: String
    ): CommentsListResponseDto

    @POST("comments")
    suspend fun createComment(@Body request: CreateCommentRequestDto): retrofit2.Response<Unit>

    @POST("comments/{commentId}/like")
    suspend fun toggleCommentLike(@Path("commentId") commentId: String): retrofit2.Response<Unit>
}
