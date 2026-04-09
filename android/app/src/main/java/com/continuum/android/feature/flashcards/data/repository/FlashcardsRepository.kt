package com.continuum.android.feature.flashcards.data.repository

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.FlashcardEntity
import com.continuum.android.core.data.local.FlashcardSetEntity
import com.continuum.android.feature.flashcards.data.remote.FlashcardsApiService
import com.continuum.android.feature.flashcards.data.remote.dto.*
import com.continuum.android.feature.flashcards.domain.Flashcard
import com.continuum.android.feature.flashcards.domain.FlashcardSet
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FlashcardsRepository @Inject constructor(
    private val api: FlashcardsApiService,
    private val db: AppDatabase
) {
    private val setDao get() = db.flashcardSetDao()
    private val cardDao get() = db.flashcardDao()

    fun getSets(): Flow<Result<List<FlashcardSet>>> = flow {
        val cached = setDao.getAll().map { it.toDomain() }
        if (cached.isNotEmpty()) emit(Result.success(cached))
        try {
            val fresh = api.getSets().sets
            setDao.deleteAll()
            setDao.insertAll(fresh.map { it.toEntity() })
            emit(Result.success(setDao.getAll().map { it.toDomain() }))
        } catch (e: IOException) {
            if (cached.isEmpty()) emit(Result.failure(e))
        } catch (e: Exception) {
            if (cached.isEmpty()) emit(Result.failure(e))
        }
    }

    suspend fun getCards(setId: String): Result<List<Flashcard>> = runCatching {
        val cached = cardDao.getBySetId(setId)
        if (cached.isNotEmpty()) return Result.success(cached.map { it.toDomain() })
        val set = api.getSetById(setId).set
        val fresh = set.flashcards.orEmpty()
        cardDao.insertAll(fresh.map { it.toEntity(setId) })
        fresh.map { it.toDomain(setId) }
    }

    suspend fun createSet(title: String, description: String): Result<FlashcardSet> = runCatching {
        val set = api.createSet(CreateSetRequestDto(title, description)).set
        setDao.insert(set.toEntity())
        set.toDomain()
    }

    suspend fun generateSet(content: String, title: String): Result<FlashcardSet> = runCatching {
        val set = api.generateSet(GenerateSetRequestDto(content, title)).set
        setDao.insert(set.toEntity())
        set.toDomain()
    }

    suspend fun deleteSet(setId: String): Result<Unit> = runCatching {
        api.deleteSet(setId)
        setDao.deleteById(setId)
        cardDao.deleteBySetId(setId)
    }

    suspend fun createCard(setId: String, front: String, back: String): Result<Unit> = runCatching {
        api.createCard(setId, CreateCardRequestDto(front, back))
        val set = api.getSetById(setId).set
        val fresh = set.flashcards.orEmpty()
        cardDao.deleteBySetId(setId)
        cardDao.insertAll(fresh.map { it.toEntity(setId) })
    }

    suspend fun updateCard(setId: String, cardId: String, front: String, back: String): Result<Unit> = runCatching {
        api.updateCard(setId, cardId, UpdateCardRequestDto(front, back))
        val existing = cardDao.getBySetId(setId).find { it.id == cardId } ?: return@runCatching
        cardDao.update(existing.copy(front = front, back = back))
    }

    suspend fun deleteCard(setId: String, cardId: String): Result<Unit> = runCatching {
        api.deleteCard(setId, cardId)
        cardDao.deleteById(cardId)
    }

    suspend fun updateProgress(setId: String, cardId: String, correct: Boolean): Result<Unit> = runCatching {
        api.updateCardProgress(setId, cardId, CardProgressRequestDto(correct))
    }

    private fun FlashcardSetDto.toEntity() = FlashcardSetEntity(
        id = id,
        title = title,
        description = description,
        cardCount = resolvedCardCount(),
        updatedAt = updatedAt
    )
    private fun FlashcardSetEntity.toDomain() = FlashcardSet(
        id = id, title = title, description = description, cardCount = cardCount,
        isAIGenerated = false, lastStudied = null, updatedAt = updatedAt
    )
    private fun FlashcardSetDto.toDomain() = FlashcardSet(
        id = id, title = title, description = description, cardCount = resolvedCardCount(),
        isAIGenerated = isAIGenerated, lastStudied = resolvedLastStudied(), updatedAt = updatedAt
    )
    private fun FlashcardDto.toEntity(parentSetId: String) = FlashcardEntity(
        id = id,
        setId = setId ?: parentSetId,
        front = front,
        back = back,
        position = resolvedPosition()
    )
    private fun FlashcardEntity.toDomain() = Flashcard(
        id = id, setId = setId, front = front, back = back, position = position
    )
    private fun FlashcardDto.toDomain(parentSetId: String) = Flashcard(
        id = id,
        setId = setId ?: parentSetId,
        front = front,
        back = back,
        position = resolvedPosition()
    )
}
