package com.continuum.android.feature.career.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ApplicationDto(
    @Json(name = "_id") val id: String = "",
    val company: String = "",
    val position: String = "",
    val status: String = "saved",   // saved | applied | interview | offer | rejected
    val appliedDate: String? = null,
    val jobUrl: String? = null,
    val notes: String = "",
    val contacts: List<ContactDto> = emptyList(),
    val updatedAt: String = ""
)

@JsonClass(generateAdapter = true)
data class ContactDto(
    val name: String = "",
    val role: String = "",
    val linkedIn: String? = null
)

@JsonClass(generateAdapter = true)
data class ApplicationsResponseDto(
    val success: Boolean = false,
    val data: List<ApplicationDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ApplicationResponseDto(
    val success: Boolean = false,
    val data: ApplicationDto = ApplicationDto()
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
    val targetRole: String = "",
    val version: Int = 1,
    val uploadDate: String = "",
    val cloudinaryUrl: String = "",
    val aiScore: Int? = null
)

@JsonClass(generateAdapter = true)
data class ResumesResponseDto(
    val success: Boolean = false,
    val data: List<ResumeDto> = emptyList()
)

@JsonClass(generateAdapter = true)
data class ResumeResponseDto(
    val success: Boolean = false,
    val data: ResumeDto = ResumeDto()
)

@JsonClass(generateAdapter = true)
data class ResumeFeedbackDto(
    val overallScore: Int = 0,
    val experience: Int = 0,
    val education: Int = 0,
    val skills: Int = 0,
    val keywords: Int = 0,
    val formatting: Int = 0,
    val strengths: List<String> = emptyList(),
    val improvements: List<String> = emptyList(),
    val keywordGaps: List<String> = emptyList(),
    val generatedAt: String = "",
    val model: String = ""
)

@JsonClass(generateAdapter = true)
data class ResumeFeedbackResponseDto(
    val success: Boolean = false,
    val data: ResumeFeedbackDto = ResumeFeedbackDto()
)
