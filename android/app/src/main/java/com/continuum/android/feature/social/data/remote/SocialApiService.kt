package com.continuum.android.feature.social.data.remote

import com.continuum.android.feature.social.data.remote.dto.*
import retrofit2.http.*

interface SocialApiService {

    @GET("activity")
    suspend fun getActivity(@Query("cursor") cursor: String? = null): ActivityResponseDto

    @GET("friends")
    suspend fun getFriends(): FriendsResponseDto

    @GET("friends/requests")
    suspend fun getFriendRequests(): FriendRequestsResponseDto

    @POST("friends/request")
    suspend fun sendFriendRequest(@Body request: SendFriendRequestDto): retrofit2.Response<Unit>

    @POST("friends/accept/{requestId}")
    suspend fun acceptFriendRequest(@Path("requestId") requestId: String): retrofit2.Response<Unit>

    @DELETE("friends/decline/{requestId}")
    suspend fun declineFriendRequest(@Path("requestId") requestId: String): retrofit2.Response<Unit>

    @DELETE("friends/{userId}")
    suspend fun removeFriend(@Path("userId") userId: String): retrofit2.Response<Unit>

    @GET("users/search")
    suspend fun searchUsers(@Query("q") query: String): UserSearchResponseDto

    @GET("notes/{noteId}/shared")
    suspend fun getSharedNote(@Path("noteId") noteId: String): NoteWithCommentsResponseDto

    @POST("notes/{noteId}/comments")
    suspend fun addComment(
        @Path("noteId") noteId: String,
        @Body request: AddCommentRequestDto
    ): retrofit2.Response<Unit>

    @POST("notes/{noteId}/comments/{commentId}/like")
    suspend fun likeComment(
        @Path("noteId") noteId: String,
        @Path("commentId") commentId: String
    ): retrofit2.Response<Unit>
}
