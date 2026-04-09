package com.continuum.android.feature.career.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ApplicationDto(
    @Json(name = "_id") val id: String = "",
    val company: String = "",
    val position: String = "",
    val status: String = "saved",
    @Json(name = "appliedAt") val appliedAt: String? = null,
    val jobUrl: String? = null,
    val notes: String = "",
    val contacts: List<ContactDto> = emptyList(),
    val updatedAt: String = ""
)

@JsonClass(generateAdapter = true)
data class ContactDto(
    val name: String = "",
    val role: String = "",
    val email: String? = null,
    val linkedIn: String? = null
)

@JsonClass(generateAdapter = true)
data class ApplicationsResponseDto(
    val success: Boolean = false,
    val applications: List<ApplicationDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ApplicationResponseDto(
    val success: Boolean = false,
    val application: ApplicationDto = ApplicationDto()
)

@JsonClass(generateAdapter = true)
data class CreateApplicationRequestDto(
    val company: String,
    val position: String,
    val status: String = "saved",
    val jobUrl: String? = null
)

@JsonClass(generateAdapter = true)
data class UpdateApplicationRequestDto(
    val status: String? = null,
    val notes: String? = null
)

@JsonClass(generateAdapter = true)
data class ResumeDto(
    @Json(name = "_id") val id: String = "",
    val fileName: String = "",
    val targetRole: String? = null,
    val version: String? = null,
    @Json(name = "uploadedAt") val uploadedAt: String = "",
    @Json(name = "fileUrl") val fileUrl: String = "",
    val aiScore: Int? = null
)

@JsonClass(generateAdapter = true)
data class ResumesResponseDto(
    val success: Boolean = false,
    val resumes: List<ResumeDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ResumeResponseDto(
    val success: Boolean = false,
    val resume: ResumeDto = ResumeDto()
)

@JsonClass(generateAdapter = true)
data class ResumeFeedbackSectionDto(
    val name: String? = null,
    val score: Int? = null
)

@JsonClass(generateAdapter = true)
data class KeywordOptimizationDto(
    val presentKeywords: List<String> = emptyList(),
    val missingKeywords: List<String> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ResumeFeedbackDto(
    val overallScore: Int = 0,
    val strengths: List<String> = emptyList(),
    val improvements: List<String> = emptyList(),
    val sections: List<ResumeFeedbackSectionDto> = emptyList(),
    val keywordOptimization: KeywordOptimizationDto? = null,
    val model: String = "",
    val generatedAt: String = ""
)

@JsonClass(generateAdapter = true)
data class ResumeFeedbackResponseDto(
    val success: Boolean = false,
    val feedback: ResumeFeedbackDto = ResumeFeedbackDto()
)

@JsonClass(generateAdapter = true)
data class ApplicationsPipelineDto(
    val draft: Int = 0,
    val applied: Int = 0,
    val interview: Int = 0,
    val offer: Int = 0,
    val rejected: Int = 0,
    val withdrawn: Int = 0
)

@JsonClass(generateAdapter = true)
data class ApplicationsDashboardResponseDto(
    val success: Boolean = false,
    val total: Int = 0,
    val pipeline: ApplicationsPipelineDto = ApplicationsPipelineDto()
)
