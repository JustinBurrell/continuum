package com.continuum.android.feature.notifications.data.remote

import com.continuum.android.feature.notifications.data.remote.dto.NotificationsResponseDto
import retrofit2.Response
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.Query

interface NotificationsApiService {

    @GET("notifications")
    suspend fun getNotifications(
        @Query("cursor") cursor: String? = null,
        @Query("limit") limit: Int? = null
    ): NotificationsResponseDto

    @PATCH("notifications/read")
    suspend fun markAllRead(): Response<Unit>

    @PATCH("notifications/{id}/read")
    suspend fun markOneRead(@Path("id") id: String): Response<Unit>

    @DELETE("notifications/{id}")
    suspend fun deleteNotification(@Path("id") id: String): Response<Unit>
}
