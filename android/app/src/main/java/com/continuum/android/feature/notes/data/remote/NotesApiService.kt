package com.continuum.android.feature.notes.data.remote

import com.continuum.android.feature.notes.data.remote.dto.*
import retrofit2.http.*

interface NotesApiService {

    @GET("notes")
    suspend fun getNotes(
        @Query("search") search: String? = null,
        @Query("type") type: String? = null
    ): NotesListResponseDto

    @GET("notes/shared")
    suspend fun getSharedNotes(
        @Query("search") search: String? = null
    ): NotesListResponseDto

    @GET("notes/{id}")
    suspend fun getNoteById(@Path("id") id: String): NoteResponseDto

    @POST("notes")
    suspend fun createNote(@Body request: CreateNoteRequestDto): NoteResponseDto

    @PUT("notes/{id}")
    suspend fun updateNote(
        @Path("id") id: String,
        @Body request: UpdateNoteRequestDto
    ): NoteResponseDto

    @DELETE("notes/{id}")
    suspend fun deleteNote(@Path("id") id: String): retrofit2.Response<Unit>

    @POST("notes/{id}/summary")
    suspend fun generateSummary(@Path("id") id: String): NoteResponseDto

    @POST("notes/{id}/flashcards/generate")
    suspend fun generateFlashcards(@Path("id") id: String): GenerateFlashcardsResponseDto

    @GET("google/files")
    suspend fun getDriveFiles(): DriveFilesResponseDto

    @POST("notes/import")
    suspend fun importFromDrive(@Body request: ImportNoteRequestDto): NoteResponseDto
}
