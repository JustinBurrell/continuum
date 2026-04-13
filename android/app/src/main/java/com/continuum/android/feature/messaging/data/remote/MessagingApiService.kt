package com.continuum.android.feature.messaging.data.remote

import com.continuum.android.feature.messaging.data.remote.dto.*
import retrofit2.http.*
import retrofit2.Response

interface MessagingApiService {

    @GET("conversations")
    suspend fun getConversations(@Query("search") search: String? = null): ConversationsResponseDto

    @POST("conversations")
    suspend fun startConversation(@Body request: StartConversationRequestDto): StartConversationResponseDto

    @DELETE("conversations/{id}")
    suspend fun deleteConversation(@Path("id") conversationId: String): retrofit2.Response<Unit>

    @GET("conversations/{id}/messages")
    suspend fun getMessages(
        @Path("id") conversationId: String,
        @Query("search") search: String? = null
    ): MessagesResponseDto

    @POST("conversations/{id}/messages")
    suspend fun sendMessage(
        @Path("id") conversationId: String,
        @Body request: SendMessageRequestDto
    ): MessageResponseDto
}
