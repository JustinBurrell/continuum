package com.continuum.android.feature.notes.data.remote.dto

import com.continuum.android.core.network.json.OwnerRef
import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class NoteDto(
    @Json(name = "_id") val id: String = "",
    val title: String = "",
    val content: String = "",
    val type: String? = null,
    val tags: List<String> = emptyList(),
    @Json(name = "isPinned") val isPinned: Boolean = false,
    val visibility: String = "private",
    val googleDocId: String? = null,
    val hasFlashcards: Boolean = false,
    val summary: NoteSummaryDto? = null,
    val updatedAt: String = "",
    val createdAt: String = "",
    /** Populated on shared-notes list; string or object from API — see [OwnerRef]. */
    @Json(name = "userId") val owner: OwnerRef? = null
)

@JsonClass(generateAdapter = true)
data class NoteSummaryDto(
    @Json(name = "quickSummary") val quick: String? = null,
    @Json(name = "detailedSummary") val detailed: String? = null
)

@JsonClass(generateAdapter = true)
data class PaginationDto(
    val total: Int = 0,
    val page: Int = 1,
    val limit: Int = 20,
    val pages: Int = 1
)

@JsonClass(generateAdapter = true)
data class NotesListResponseDto(
    val success: Boolean = false,
    val notes: List<NoteDto> = emptyList(),
    val pagination: PaginationDto? = null
)

@JsonClass(generateAdapter = true)
data class NoteResponseDto(
    val success: Boolean = false,
    val note: NoteDto = NoteDto(),
    val cached: Boolean? = null
)

@JsonClass(generateAdapter = true)
data class CreateNoteRequestDto(
    val title: String,
    val content: String = "",
    val tags: List<String> = emptyList(),
    val visibility: String = "private"
)

@JsonClass(generateAdapter = true)
data class UpdateNoteRequestDto(
    val title: String? = null,
    val content: String? = null,
    val tags: List<String>? = null,
    val visibility: String? = null
)

@JsonClass(generateAdapter = true)
data class ImportNoteRequestDto(
    val googleDocId: String,
    val googleDocUrl: String,
    val title: String
)

@JsonClass(generateAdapter = true)
data class FlashcardSetRefDto(@Json(name = "_id") val id: String = "")

@JsonClass(generateAdapter = true)
data class GenerateFlashcardsResponseDto(
    val success: Boolean = false,
    val set: FlashcardSetRefDto? = null,
    val data: FlashcardSetRefDto? = null  // backend may use either key
)

@JsonClass(generateAdapter = true)
data class DriveFileDto(
    val id: String = "",
    val name: String = "",
    val modifiedTime: String = ""
)

@JsonClass(generateAdapter = true)
data class DriveFilesResponseDto(
    val success: Boolean = false,
    val files: List<DriveFileDto> = emptyList()
)
