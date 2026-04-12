package com.continuum.android.feature.flashcards.domain

data class FlashcardSet(
    val id: String,
    val title: String,
    val description: String,
    val cardCount: Int,
    val isAIGenerated: Boolean,
    val lastStudied: String?,
    val updatedAt: String,
    /** Set owner when returned from shared-sets API (not in Room cache rows). */
    val ownerUserId: String? = null
)

data class Flashcard(
    val id: String,
    val setId: String,
    val front: String,
    val back: String,
    val position: Int
)
