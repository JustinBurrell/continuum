package com.continuum.android.feature.notes.data.repository

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.NoteEntity
import com.continuum.android.feature.notes.data.remote.NotesApiService
import com.continuum.android.feature.notes.data.remote.dto.*
import com.continuum.android.feature.notes.domain.DriveFile
import com.continuum.android.feature.notes.domain.Note
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotesRepository @Inject constructor(
    private val api: NotesApiService,
    private val db: AppDatabase
) {
    private val noteDao get() = db.noteDao()

    // NetworkBoundResource: emit cached first, then fetch fresh
    fun getNotes(): Flow<Result<List<Note>>> = flow {
        val cached = noteDao.getAll().map { it.toDomain() }
        if (cached.isNotEmpty()) emit(Result.success(cached))
        try {
            val fresh = api.getNotes().notes
            noteDao.deleteAll()
            noteDao.insertAll(fresh.map { it.toEntity() })
            emit(Result.success(noteDao.getAll().map { it.toDomain() }))
        } catch (e: IOException) {
            if (cached.isEmpty()) emit(Result.failure(e))
        } catch (e: Exception) {
            if (cached.isEmpty()) emit(Result.failure(e))
        }
    }

    suspend fun getNoteById(id: String): Result<Note> = runCatching {
        val cached = noteDao.getById(id)
        if (cached != null) return Result.success(cached.toDomain())
        val remote = api.getNoteById(id).note
        noteDao.insert(remote.toEntity())
        remote.toDomain()
    }

    suspend fun createNote(title: String, content: String, tags: List<String>, visibility: String): Result<Note> =
        runCatching {
            val note = api.createNote(CreateNoteRequestDto(title, content, tags, visibility)).note
            noteDao.insert(note.toEntity())
            note.toDomain()
        }

    suspend fun updateNote(id: String, title: String?, content: String?, tags: List<String>?, visibility: String?): Result<Note> =
        runCatching {
            val note = api.updateNote(id, UpdateNoteRequestDto(title, content, tags, visibility)).note
            noteDao.insert(note.toEntity())
            note.toDomain()
        }

    suspend fun deleteNote(id: String): Result<Unit> = runCatching {
        api.deleteNote(id)
        noteDao.deleteById(id)
    }

    suspend fun generateSummary(id: String): Result<Note> = runCatching {
        val note = api.generateSummary(id).note
        noteDao.insert(note.toEntity())
        note.toDomain()
    }

    suspend fun generateFlashcards(id: String): Result<Unit> = runCatching {
        api.generateFlashcards(id)
        Unit
    }

    suspend fun getDriveFiles(): Result<List<DriveFile>> = runCatching {
        api.getDriveFiles().files.map { DriveFile(it.id, it.name, it.modifiedTime) }
    }

    suspend fun importFromDrive(googleDocId: String, title: String): Result<Note> = runCatching {
        val note = api.importFromDrive(ImportNoteRequestDto(googleDocId, title)).note
        noteDao.insert(note.toEntity())
        note.toDomain()
    }

    // --- Mappers ---

    private fun NoteDto.toEntity() = NoteEntity(
        id = id,
        title = title,
        content = content,
        tags = tags.joinToString(","),
        isFavorite = isPinned,
        updatedAt = updatedAt,
        createdAt = createdAt
    )

    private fun NoteEntity.toDomain() = Note(
        id = id,
        title = title,
        content = content,
        tags = tags.split(",").filter { it.isNotBlank() },
        isFavorite = isFavorite,
        visibility = "private",
        googleDocId = null,
        hasFlashcards = false,
        quickSummary = null,
        detailedSummary = null,
        updatedAt = updatedAt,
        createdAt = createdAt
    )

    private fun NoteDto.toDomain() = Note(
        id = id,
        title = title,
        content = content,
        tags = tags,
        isFavorite = isPinned,
        visibility = visibility,
        googleDocId = googleDocId,
        hasFlashcards = hasFlashcards,
        quickSummary = summary?.quick,
        detailedSummary = summary?.detailed,
        updatedAt = updatedAt,
        createdAt = createdAt
    )
}
