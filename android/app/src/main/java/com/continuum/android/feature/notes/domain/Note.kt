package com.continuum.android.feature.notes.domain

data class Note(
    val id: String,
    val title: String,
    val content: String,
    val type: String,
    val tags: List<String>,
    val isFavorite: Boolean,
    val visibility: String,
    val googleDocId: String?,
    /** URL for opening the source Google Doc in a browser. */
    val googleDocUrl: String?,
    /** Cloudinary URL — present signals a PDF exists; use /notes/:id/pdf for the signed download URL. */
    val pdfUrl: String?,
    val hasFlashcards: Boolean,
    val quickSummary: String?,
    val detailedSummary: String?,
    val updatedAt: String,
    val createdAt: String,
    /** Note owner when returned from shared-notes API (not stored in Room cache). */
    val ownerUserId: String? = null,
    /** Display name of the owner (first+last or username). */
    val ownerName: String? = null
) {
    val hasSummary: Boolean get() = !quickSummary.isNullOrBlank() || !detailedSummary.isNullOrBlank()
    val preview: String get() = content.replace(Regex("<[^>]+>"), "").take(120)
}

data class DriveFile(
    val id: String,
    val name: String,
    val modifiedTime: String
)
