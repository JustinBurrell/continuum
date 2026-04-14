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

    suspend fun addContact(appId: String, name: String, role: String?, linkedIn: String?, email: String?): Result<Application> = runCatching {
        api.addContact(appId, AddContactRequestDto(name = name, role = role, linkedIn = linkedIn, email = email)).application.toDomain()
    }

    suspend fun deleteContact(appId: String, contactId: String): Result<Application> = runCatching {
        api.deleteContact(appId, contactId).application.toDomain()
    }

    suspend fun addReminder(appId: String, date: String, description: String): Result<Application> = runCatching {
        api.addReminder(appId, AddReminderRequestDto(date = date, description = description)).application.toDomain()
    }

    suspend fun deleteReminder(appId: String, reminderId: String): Result<Application> = runCatching {
        api.deleteReminder(appId, reminderId).application.toDomain()
    }

    suspend fun getResumes(): Result<List<Resume>> = runCatching {
        api.getResumes().resumes.map { it.toDomain() }
    }

    suspend fun uploadResume(filePart: MultipartBody.Part): Result<Resume> = runCatching {
        api.uploadResume(filePart).resume.toDomain()
    }

    suspend fun deleteResume(id: String): Result<Unit> = runCatching { api.deleteResume(id); Unit }

    suspend fun getExistingFeedback(id: String): Result<ResumeFeedback> = runCatching {
        api.getExistingFeedback(id).feedback.toDomain()
    }

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
        contacts = contacts.map { Contact(id = it.id, name = it.name, role = it.role, linkedIn = it.linkedIn, email = it.email) },
        reminders = followUpReminders.map { Reminder(id = it.id, date = it.date, description = it.description, completed = it.completed) },
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
