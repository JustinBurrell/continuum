package com.continuum.android.feature.notifications.data.repository

import com.continuum.android.feature.notifications.data.remote.NotificationsApiService
import com.continuum.android.feature.notifications.data.remote.dto.toDomain
import com.continuum.android.feature.notifications.domain.Notification
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationsRepository @Inject constructor(
    private val api: NotificationsApiService
) {

    // Returns (items, nextCursor, unreadCount)
    suspend fun getNotifications(cursor: String? = null): Result<Triple<List<Notification>, String?, Int>> =
        runCatching {
            val resp = api.getNotifications(cursor = cursor, limit = 20)
            Triple(
                resp.notifications.map { it.toDomain() },
                resp.nextCursor,
                resp.unreadCount
            )
        }

    suspend fun markAllRead(): Result<Unit> = runCatching {
        api.markAllRead()
        Unit
    }

    suspend fun markOneRead(id: String): Result<Unit> = runCatching {
        api.markOneRead(id)
        Unit
    }

    suspend fun deleteNotification(id: String): Result<Unit> = runCatching {
        api.deleteNotification(id)
        Unit
    }
}
