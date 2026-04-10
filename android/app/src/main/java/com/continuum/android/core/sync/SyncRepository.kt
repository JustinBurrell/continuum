package com.continuum.android.core.sync

import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.SyncQueueEntity
import com.continuum.android.core.network.ApiClient
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Reads pending operations from the local SyncQueue, batches them,
 * and POSTs to POST /api/sync. Marks each item completed or increments retryCount on failure.
 */
@Singleton
class SyncRepository @Inject constructor(
    private val db: AppDatabase,
    private val apiClient: ApiClient
) {
    private val syncQueueDao get() = db.syncQueueDao()

    suspend fun processPendingOperations() {
        val pending = syncQueueDao.getAll()
        if (pending.isEmpty()) return

        val operations = JSONArray()
        pending.forEach { item ->
            operations.put(JSONObject().apply {
                put("operation", item.operation)
                put("collection", item.resourceType)
                item.resourceId?.let { put("documentId", it) }
                put("data", JSONObject(item.payload))
                put("clientTimestamp", item.createdAt)
            })
        }

        val body = JSONObject().put("operations", operations).toString()
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("${apiClient.retrofit.baseUrl()}sync")
            .post(body)
            .addHeader("X-Client-Type", "android")
            .build()

        try {
            val response = apiClient.okHttpClient.newCall(request).execute()
            if (response.isSuccessful) {
                pending.forEach { item -> syncQueueDao.delete(item) }
            } else {
                pending.forEach { item ->
                    syncQueueDao.update(item.copy(retryCount = item.retryCount + 1))
                }
            }
        } catch (_: Exception) {
            pending.forEach { item ->
                syncQueueDao.update(item.copy(retryCount = item.retryCount + 1))
            }
        }
    }

    suspend fun enqueue(
        operation: String,
        resourceType: String,
        resourceId: String? = null,
        payload: String
    ) {
        syncQueueDao.insert(
            SyncQueueEntity(
                operation = operation,
                resourceType = resourceType,
                resourceId = resourceId,
                payload = payload
            )
        )
    }

    suspend fun pendingCount(): Int = syncQueueDao.count()
}
