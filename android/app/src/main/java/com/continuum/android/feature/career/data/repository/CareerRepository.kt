package com.continuum.android.feature.career.data.repository

import com.continuum.android.feature.career.data.remote.CareerApiService
import com.continuum.android.feature.career.data.remote.dto.*
import com.continuum.android.feature.career.domain.*
import okhttp3.MultipartBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CareerRepository @Inject constructor(private val api: CareerApiService) {

    suspend fun getApplications(): Result<List<Application>> = runCatching {
        api.getApplications().data.map { it.toDomain() }
    }

    suspend fun createApplication(company: String, position: String, status: String, jobUrl: String?): Result<Application> = runCatching {
        api.createApplication(CreateApplicationRequestDto(company, position, status, jobUrl)).data.toDomain()
    }

    suspend fun updateApplication(id: String, status: String?, notes: String?): Result<Application> = runCatching {
        api.updateApplication(id, UpdateApplicationRequestDto(status, notes)).data.toDomain()
    }

    suspend fun deleteApplication(id: String): Result<Unit> = runCatching { api.deleteApplication(id); Unit }

    suspend fun getResumes(): Result<List<Resume>> = runCatching {
        api.getResumes().data.map { it.toDomain() }
    }

    suspend fun uploadResume(filePart: MultipartBody.Part): Result<Resume> = runCatching {
        api.uploadResume(filePart).data.toDomain()
    }

    suspend fun deleteResume(id: String): Result<Unit> = runCatching { api.deleteResume(id); Unit }

    suspend fun generateFeedback(id: String): Result<ResumeFeedback> = runCatching {
        api.generateFeedback(id).data.toDomain()
    }

    // Mappers
    private fun ApplicationDto.toDomain() = Application(
        id, company, position, status, appliedDate, jobUrl, notes,
        contacts.map { Contact(it.name, it.role, it.linkedIn) }, updatedAt
    )
    private fun ResumeDto.toDomain() = Resume(id, fileName, targetRole, version, uploadDate, cloudinaryUrl, aiScore)
    private fun ResumeFeedbackDto.toDomain() = ResumeFeedback(
        overallScore, experience, education, skills, keywords, formatting,
        strengths, improvements, keywordGaps, generatedAt, model
    )
}
