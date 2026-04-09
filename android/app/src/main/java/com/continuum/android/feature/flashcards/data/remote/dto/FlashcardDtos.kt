package com.continuum.android.feature.flashcards.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class FlashcardSetDto(
    @Json(name = "_id") val id: String = "",
    val title: String = "",
    val description: String = "",
    val cardCount: Int = 0,
    val isAIGenerated: Boolean = false,
    val lastStudied: String? = null,
    val updatedAt: String = ""
)

@JsonClass(generateAdapter = true)
data class FlashcardDto(
    @Json(name = "_id") val id: String = "",
    val setId: String = "",
    val front: String = "",
    val back: String = "",
    val position: Int = 0
)

@JsonClass(generateAdapter = true)
data class FlashcardSetsResponseDto(
    val success: Boolean = false,
    val data: List<FlashcardSetDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class FlashcardSetResponseDto(
    val success: Boolean = false,
    val data: FlashcardSetDto = FlashcardSetDto()
)

@JsonClass(generateAdapter = true)
data class FlashcardsResponseDto(
    val success: Boolean = false,
    val data: List<FlashcardDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class CreateSetRequestDto(
    val title: String,
    val description: String = ""
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
