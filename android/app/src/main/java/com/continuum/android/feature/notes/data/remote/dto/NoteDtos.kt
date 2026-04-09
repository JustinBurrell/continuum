package com.continuum.android.feature.notes.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class NoteDto(
    @Json(name = "_id") val id: String = "",
    val title: String = "",
    val content: String = "",
    val tags: List<String> = emptyList(),
    val isFavorite: Boolean = false,
    val visibility: String = "private",
    val googleDocId: String? = null,
    val hasFlashcards: Boolean = false,
    val summary: NoteSummaryDto? = null,
    val updatedAt: String = "",
    val createdAt: String = ""
)

@JsonClass(generateAdapter = true)
data class NoteSummaryDto(
    val quick: String? = null,
    val detailed: String? = null
)

@JsonClass(generateAdapter = true)
data class NotesListResponseDto(
    val success: Boolean = false,
    val data: List<NoteDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class NoteResponseDto(
    val success: Boolean = false,
    val data: NoteDto = NoteDto()
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
    val title: String
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
    val data: List<DriveFileDto> = emptyList()
)
