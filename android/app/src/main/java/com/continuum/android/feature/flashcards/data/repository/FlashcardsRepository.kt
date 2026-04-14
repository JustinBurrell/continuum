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
    suspend fun querySets(search: String? = null, shared: Boolean = false): Result<List<FlashcardSet>> = runCatching {
        val sets = if (shared) {
            api.getSharedSets(search = search?.takeIf { it.isNotBlank() }).sets
        } else {
            api.getSets(search = search?.takeIf { it.isNotBlank() }).sets
        }
        if (!shared && search.isNullOrBlank()) {
            setDao.deleteAll()
            setDao.insertAll(sets.map { it.toEntity() })
        }
        sets.map { it.toDomain() }
    }

    suspend fun getStreak(): Result<Int> = runCatching { api.getStreak().streak }

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

    suspend fun updateSet(setId: String, title: String?, description: String?, visibility: String?): Result<FlashcardSet> = runCatching {
        val set = api.updateSet(setId, UpdateSetRequestDto(title, description, visibility)).set
        setDao.insert(set.toEntity())
        set.toDomain()
    }

    suspend fun shareSet(setId: String, userIds: List<String>): Result<FlashcardSet> = runCatching {
        api.shareSet(setId, ShareSetRequestDto(userIds)).set.toDomain()
    }

    suspend fun duplicateSet(setId: String): Result<FlashcardSet> = runCatching {
        val set = api.duplicateSet(setId).set
        setDao.insert(set.toEntity())
        set.toDomain()
    }

    data class StudySession(
        val id: String,
        val setId: String,
        val setTitle: String? = null,
        val completedAt: String,
        val durationSeconds: Int,
        val totalCards: Int,
        val correctCount: Int,
        val score: Int
    )

    data class StudySessionCardOutcome(
        val front: String,
        val back: String?,
        val correct: Boolean
    )

    suspend fun submitStudySession(
        setId: String, durationSeconds: Int, totalCards: Int, correctCount: Int,
        score: Int, cardResults: List<CardResultDto>
    ): Result<StudySession> = runCatching {
        val session = api.submitStudySession(
            SubmitStudySessionRequestDto(setId, durationSeconds, totalCards, correctCount, score, cardResults)
        ).session
        session.toDomainSession()
    }

    suspend fun getUserStudySessions(page: Int? = null, limit: Int? = null): Result<List<StudySession>> = runCatching {
        api.getUserStudySessions(page = page, limit = limit).sessions.map { it.toDomainSession() }
    }

    suspend fun getSetStudySessions(
        setId: String,
        page: Int? = null,
        limit: Int? = null
    ): Result<List<StudySession>> = runCatching {
        api.getSetStudySessions(setId, page = page, limit = limit).sessions.map { it.toDomainSession() }
    }

    suspend fun getStudySessionDetail(sessionId: String): Result<List<StudySessionCardOutcome>> = runCatching {
        val session = api.getStudySessionById(sessionId).session
        session.cardResults.orEmpty().map { row ->
            val card = row.cardId
            StudySessionCardOutcome(
                front = card?.front?.takeIf { it.isNotBlank() } ?: "Card",
                back = card?.back?.takeIf { it.isNotBlank() },
                correct = row.correct
            )
        }
    }

    private fun StudySessionListItemDto.toDomainSession() = StudySession(
        id = id, setId = setId, setTitle = setTitle, completedAt = completedAt,
        durationSeconds = durationSeconds, totalCards = totalCards,
        correctCount = correctCount, score = score
    )

    private fun StudySessionDto.toDomainSession() = StudySession(
        id = id, setId = setId, setTitle = null, completedAt = completedAt,
        durationSeconds = durationSeconds, totalCards = totalCards,
        correctCount = correctCount, score = score
    )

    private fun FlashcardSetDto.toEntity() = FlashcardSetEntity(
        id = id,
        title = title,
        description = description,
        cardCount = resolvedCardCount(),
        updatedAt = updatedAt
    )
    private fun FlashcardSetEntity.toDomain() = FlashcardSet(
        id = id, title = title, description = description, cardCount = cardCount,
        isAIGenerated = false, lastStudied = null, updatedAt = updatedAt, ownerUserId = null
    )
    private fun FlashcardSetDto.toDomain() = FlashcardSet(
        id = id, title = title, description = description, cardCount = resolvedCardCount(),
        isAIGenerated = isAIGenerated, lastStudied = resolvedLastStudied(), updatedAt = updatedAt,
        ownerUserId = owner?.id?.takeIf { it.isNotBlank() },
        ownerName = owner?.displayName
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
