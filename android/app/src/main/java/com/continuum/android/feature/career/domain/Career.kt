package com.continuum.android.feature.career.domain

data class Application(
    val id: String,
    val company: String,
    val position: String,
    val status: String,
    val appliedDate: String?,
    val jobUrl: String?,
    val notes: String,
    val contacts: List<Contact>,
    val updatedAt: String
)

data class Contact(
    val name: String,
    val role: String,
    val linkedIn: String?
)

data class Resume(
    val id: String,
    val fileName: String,
    val targetRole: String,
    val version: Int,
    val uploadDate: String,
    val cloudinaryUrl: String,
    val aiScore: Int?
)

data class ResumeFeedback(
    val overallScore: Int,
    val experience: Int,
    val education: Int,
    val skills: Int,
    val keywords: Int,
    val formatting: Int,
    val strengths: List<String>,
    val improvements: List<String>,
    val keywordGaps: List<String>,
    val generatedAt: String,
    val model: String
)
