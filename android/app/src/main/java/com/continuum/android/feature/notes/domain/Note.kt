package com.continuum.android.feature.notes.domain

data class Note(
    val id: String,
    val title: String,
    val content: String,
    val tags: List<String>,
    val isFavorite: Boolean,
    val visibility: String,
    val googleDocId: String?,
    val hasFlashcards: Boolean,
    val quickSummary: String?,
    val detailedSummary: String?,
    val updatedAt: String,
    val createdAt: String
) {
    val hasSummary: Boolean get() = !quickSummary.isNullOrBlank() || !detailedSummary.isNullOrBlank()
    val preview: String get() = content.replace(Regex("<[^>]+>"), "").take(120)
}

data class DriveFile(
    val id: String,
    val name: String,
    val modifiedTime: String
)
