package com.continuum.android.feature.flashcards.data.remote.dto

import com.continuum.android.core.network.json.OwnerRef
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class FlashcardSetDto(
    @Json(name = "_id") val id: String = "",
    val title: String = "",
    val description: String = "",
    @Json(name = "totalCards") val totalCards: Int = 0,
    val cardCount: Int = 0,
    val isAIGenerated: Boolean = false,
    @Json(name = "lastStudiedAt") val lastStudiedAt: String? = null,
    val lastStudied: String? = null,
    val updatedAt: String = "",
    val flashcards: List<FlashcardDto>? = null,
    @Json(name = "userId") val owner: OwnerRef? = null
) {
    fun resolvedCardCount(): Int = when {
        totalCards > 0 -> totalCards
        cardCount > 0 -> cardCount
        else -> flashcards?.size ?: 0
    }

    fun resolvedLastStudied(): String? = lastStudiedAt ?: lastStudied
}

@JsonClass(generateAdapter = true)
data class FlashcardDto(
    @Json(name = "_id") val id: String = "",
    val setId: String? = null,
    val front: String = "",
    val back: String = "",
    @Json(name = "order") val order: Int = 0,
    val position: Int = 0
) {
    fun resolvedPosition(): Int = if (position != 0) position else order
}

@JsonClass(generateAdapter = true)
data class FlashcardSetsResponseDto(
    val success: Boolean = false,
    val sets: List<FlashcardSetDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class FlashcardSetResponseDto(
    val success: Boolean = false,
    val set: FlashcardSetDto = FlashcardSetDto()
)

@JsonClass(generateAdapter = true)
data class CreateSetRequestDto(
    val title: String,
    val visibility: String = "private"
)

@JsonClass(generateAdapter = true)
data class GenerateSetRequestDto(
    val content: String,
    val title: String
)

@JsonClass(generateAdapter = true)
data class CreateCardRequestDto(
    val front: String,
    val back: String
)

@JsonClass(generateAdapter = true)
data class UpdateCardRequestDto(
    val front: String? = null,
    val back: String? = null
)

@JsonClass(generateAdapter = true)
data class CardProgressRequestDto(
    val correct: Boolean
)

@JsonClass(generateAdapter = true)
data class StudyStreakResponseDto(
    val success: Boolean = false,
    val streak: Int = 0
)

@JsonClass(generateAdapter = true)
data class SubmitStudySessionRequestDto(
    val setId: String,
    val durationSeconds: Int,
    val totalCards: Int,
    val correctCount: Int,
    val score: Int,
    val cardResults: List<CardResultDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class CardResultDto(
    val cardId: String,
    val correct: Boolean
)

@JsonClass(generateAdapter = true)
data class StudySessionDto(
    @Json(name = "_id") val id: String = "",
    val setId: String = "",
    val completedAt: String = "",
    val durationSeconds: Int = 0,
    val totalCards: Int = 0,
    val correctCount: Int = 0,
    val score: Int = 0
)

@JsonClass(generateAdapter = true)
data class StudySessionResponseDto(
    val success: Boolean = false,
    val session: StudySessionDto = StudySessionDto()
)

@JsonClass(generateAdapter = true)
data class StudySessionsListResponseDto(
    val success: Boolean = false,
    val sessions: List<StudySessionDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class UpdateSetRequestDto(
    val title: String? = null,
    val description: String? = null,
    val visibility: String? = null
)

@JsonClass(generateAdapter = true)
data class ShareSetRequestDto(
    val userIds: List<String>
)

@JsonClass(generateAdapter = true)
data class DuplicateSetResponseDto(
    val success: Boolean = false,
    val set: FlashcardSetDto = FlashcardSetDto()
)
