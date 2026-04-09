package com.continuum.android.feature.career.data.repository

import com.continuum.android.feature.career.data.remote.CareerApiService
import com.continuum.android.feature.career.data.remote.dto.*
import com.continuum.android.feature.career.domain.*
import okhttp3.MultipartBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CareerRepository @Inject constructor(private val api: CareerApiService) {

    suspend fun getApplications(search: String? = null, status: String? = null): Result<List<Application>> = runCatching {
        api.getApplications(
            search = search?.takeIf { it.isNotBlank() },
            status = status?.takeIf { it.isNotBlank() && it != "all" }
        ).applications.map { it.toDomain() }
    }

    suspend fun createApplication(company: String, position: String, status: String, jobUrl: String?): Result<Application> = runCatching {
        api.createApplication(CreateApplicationRequestDto(company, position, status, jobUrl)).application.toDomain()
    }

    suspend fun updateApplication(id: String, status: String?, notes: String?): Result<Application> = runCatching {
        api.updateApplication(id, UpdateApplicationRequestDto(status, notes)).application.toDomain()
    }

    suspend fun deleteApplication(id: String): Result<Unit> = runCatching { api.deleteApplication(id); Unit }

    suspend fun getResumes(search: String? = null): Result<List<Resume>> = runCatching {
        api.getResumes(search = search?.takeIf { it.isNotBlank() }).resumes.map { it.toDomain() }
    }

    suspend fun uploadResume(filePart: MultipartBody.Part): Result<Resume> = runCatching {
        api.uploadResume(filePart).resume.toDomain()
    }

    suspend fun deleteResume(id: String): Result<Unit> = runCatching { api.deleteResume(id); Unit }

    suspend fun generateFeedback(id: String): Result<ResumeFeedback> = runCatching {
        api.generateFeedback(id).feedback.toDomain()
    }

    private fun ApplicationDto.toDomain() = Application(
        id = id,
        company = company,
        position = position,
        status = status,
        appliedDate = appliedAt,
        jobUrl = jobUrl,
        notes = notes,
        contacts = contacts.map { Contact(it.name, it.role, it.linkedIn ?: it.email) },
        updatedAt = updatedAt
    )
    private fun ResumeDto.toDomain() = Resume(
        id = id,
        fileName = fileName,
        targetRole = targetRole.orEmpty(),
        version = version?.toIntOrNull() ?: 1,
        uploadDate = uploadedAt,
        cloudinaryUrl = fileUrl,
        aiScore = aiScore
    )

    private fun ResumeFeedbackDto.sectionScore(label: String): Int =
        sections.firstOrNull { it.name?.contains(label, ignoreCase = true) == true }?.score
            ?: (overallScore * 4 / 5).coerceIn(0, 100)

    private fun ResumeFeedbackDto.toDomain() = ResumeFeedback(
        overallScore = overallScore,
        experience = sectionScore("Experience"),
        education = sectionScore("Education"),
        skills = sectionScore("Skills"),
        keywords = sectionScore("Keyword"),
        formatting = sectionScore("Format"),
        strengths = strengths,
        improvements = improvements,
        keywordGaps = keywordOptimization?.missingKeywords ?: emptyList(),
        generatedAt = generatedAt,
        model = model
    )
}
