package com.continuum.android.feature.career

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.ApplicationDao
import com.continuum.android.core.data.local.ApplicationEntity
import com.continuum.android.feature.career.data.remote.CareerApiService
import com.continuum.android.feature.career.data.remote.dto.ApplicationDto
import com.continuum.android.feature.career.data.remote.dto.ApplicationResponseDto
import com.continuum.android.feature.career.data.remote.dto.ApplicationsResponseDto
import com.continuum.android.feature.career.data.repository.CareerRepository
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class CareerRepositoryTest {

    private val api: CareerApiService = mockk()
    private val db: AppDatabase = mockk()
    private val appDao: ApplicationDao = mockk(relaxed = true)
    private lateinit var repository: CareerRepository

    private fun fakeAppDto(id: String = "a1", company: String = "Anthropic", status: String = "applied") =
        ApplicationDto(id = id, company = company, position = "SWE", status = status, updatedAt = "2025-01-01")

    private fun fakeAppEntity(id: String = "a1") = ApplicationEntity(
        id = id, company = "Anthropic", position = "SWE", status = "applied",
        appliedDate = null, jobUrl = null, notes = null, updatedAt = "2025-01-01"
    )

    @Before
    fun setUp() {
        every { db.applicationDao() } returns appDao
        repository = CareerRepository(api, db)
    }

    @Test
    fun `getApplicationsFlow — emits cache first then fresh network data`() = runTest {
        coEvery { appDao.getAll() } returns listOf(fakeAppEntity("a1")) andThen listOf(fakeAppEntity("a2"))
        coEvery { api.getApplications(any(), any()) } returns ApplicationsResponseDto(true, listOf(fakeAppDto("a2")))

        val emissions = repository.getApplicationsFlow().toList()

        assertTrue(emissions.size >= 1)
        assertTrue(emissions.first().isSuccess)
    }

    @Test
    fun `getApplicationsFlow — emits failure when cache empty and API fails`() = runTest {
        coEvery { appDao.getAll() } returns emptyList()
        coEvery { api.getApplications(any(), any()) } throws RuntimeException("Network error")

        val emissions = repository.getApplicationsFlow().toList()

        assertTrue(emissions.first().isFailure)
    }

    @Test
    fun `createApplication success — inserts into cache`() = runTest {
        val dto = fakeAppDto("a3", "Stripe")
        coEvery { api.createApplication(any()) } returns ApplicationResponseDto(true, dto)

        val result = repository.createApplication("Stripe", "PM", "draft", null)

        assertTrue(result.isSuccess)
        assertEquals("Stripe", result.getOrNull()?.company)
        coVerify { appDao.insert(any()) }
    }

    @Test
    fun `createApplication failure — returns failure`() = runTest {
        coEvery { api.createApplication(any()) } throws RuntimeException("Server error")

        val result = repository.createApplication("", "", "draft", null)

        assertTrue(result.isFailure)
    }

    @Test
    fun `updateApplication success — returns updated application`() = runTest {
        val dto = fakeAppDto("a1", status = "interview")
        coEvery { api.updateApplication("a1", any()) } returns ApplicationResponseDto(true, dto)

        val result = repository.updateApplication("a1", "interview", null)

        assertTrue(result.isSuccess)
        assertEquals("interview", result.getOrNull()?.status)
    }

    @Test
    fun `deleteApplication success — calls API`() = runTest {
        coEvery { api.deleteApplication("a1") } returns mockk(relaxed = true)

        val result = repository.deleteApplication("a1")

        assertTrue(result.isSuccess)
        coVerify { api.deleteApplication("a1") }
    }

    @Test
    fun `getApplications with search — calls API with search param`() = runTest {
        val apps = listOf(fakeAppDto("a1", "Stripe"))
        coEvery { api.getApplications(search = "Stripe", status = null) } returns ApplicationsResponseDto(true, apps)

        val result = repository.getApplications(search = "Stripe")

        assertTrue(result.isSuccess)
        assertEquals("Stripe", result.getOrNull()?.first()?.company)
    }

    @Test
    fun `getResumes — returns list of resumes`() = runTest {
        coEvery { api.getResumes() } returns mockk {
            every { resumes } returns emptyList()
        }

        val result = repository.getResumes()

        assertTrue(result.isSuccess)
    }

    @Test
    fun `addContact success — returns updated application`() = runTest {
        val dto = fakeAppDto("a1")
        coEvery { api.addContact("a1", any()) } returns ApplicationResponseDto(true, dto)

        val result = repository.addContact("a1", "Alice", "PM", null, null)

        assertTrue(result.isSuccess)
    }

    @Test
    fun `deleteApplication failure — returns failure result`() = runTest {
        coEvery { api.deleteApplication("bad") } throws RuntimeException("Not found")

        val result = repository.deleteApplication("bad")

        assertTrue(result.isFailure)
    }
}
