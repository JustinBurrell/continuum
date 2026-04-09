package com.continuum.android.feature.messaging.data.remote

import com.continuum.android.feature.messaging.data.remote.dto.*
import retrofit2.http.*

interface MessagingApiService {

    @GET("conversations")
    suspend fun getConversations(): ConversationsResponseDto

    @GET("conversations/{id}/messages")
    suspend fun getMessages(@Path("id") conversationId: String): MessagesResponseDto

    @POST("conversations/{id}/messages")
    suspend fun sendMessage(
        @Path("id") conversationId: String,
        @Body request: SendMessageRequestDto
    ): MessageResponseDto
}
