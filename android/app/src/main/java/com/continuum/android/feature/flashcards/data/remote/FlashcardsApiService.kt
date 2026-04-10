package com.continuum.android.feature.flashcards.data.remote

import com.continuum.android.feature.flashcards.data.remote.dto.*
import retrofit2.http.*

interface FlashcardsApiService {

    @GET("flashcard-sets")
    suspend fun getSets(@Query("search") search: String? = null): FlashcardSetsResponseDto

    @GET("flashcard-sets/shared")
    suspend fun getSharedSets(@Query("search") search: String? = null): FlashcardSetsResponseDto

    @GET("flashcard-sets/{setId}")
    suspend fun getSetById(@Path("setId") setId: String): FlashcardSetResponseDto

    @POST("flashcard-sets")
    suspend fun createSet(@Body request: CreateSetRequestDto): FlashcardSetResponseDto

    @POST("flashcard-sets/generate")
    suspend fun generateSet(@Body request: GenerateSetRequestDto): FlashcardSetResponseDto

    @DELETE("flashcard-sets/{setId}")
    suspend fun deleteSet(@Path("setId") setId: String): retrofit2.Response<Unit>

    @POST("flashcard-sets/{setId}/cards")
    suspend fun createCard(
        @Path("setId") setId: String,
        @Body request: CreateCardRequestDto
    ): retrofit2.Response<Unit>

    @PUT("flashcard-sets/{setId}/cards/{cardId}")
    suspend fun updateCard(
        @Path("setId") setId: String,
        @Path("cardId") cardId: String,
        @Body request: UpdateCardRequestDto
    ): retrofit2.Response<Unit>

    @DELETE("flashcard-sets/{setId}/cards/{cardId}")
    suspend fun deleteCard(
        @Path("setId") setId: String,
        @Path("cardId") cardId: String
    ): retrofit2.Response<Unit>

    @PUT("flashcard-sets/{setId}/cards/{cardId}/progress")
    suspend fun updateCardProgress(
        @Path("setId") setId: String,
        @Path("cardId") cardId: String,
        @Body request: CardProgressRequestDto
    ): retrofit2.Response<Unit>

    @PATCH("flashcard-sets/{setId}")
    suspend fun updateSet(
        @Path("setId") setId: String,
        @Body request: UpdateSetRequestDto
    ): FlashcardSetResponseDto

    @PATCH("flashcard-sets/{setId}/share")
    suspend fun shareSet(
        @Path("setId") setId: String,
        @Body request: ShareSetRequestDto
    ): FlashcardSetResponseDto

    @POST("flashcard-sets/{setId}/duplicate")
    suspend fun duplicateSet(@Path("setId") setId: String): DuplicateSetResponseDto

    @POST("study-sessions")
    suspend fun submitStudySession(@Body request: SubmitStudySessionRequestDto): StudySessionResponseDto

    @GET("study-sessions")
    suspend fun getUserStudySessions(
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): StudySessionsListResponseDto

    @GET("study-sessions/set/{setId}")
    suspend fun getSetStudySessions(
        @Path("setId") setId: String,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): StudySessionsListResponseDto

    @GET("study-sessions/streak")
    suspend fun getStreak(): StudyStreakResponseDto
}
