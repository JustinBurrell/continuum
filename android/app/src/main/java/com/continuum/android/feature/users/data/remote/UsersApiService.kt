package com.continuum.android.feature.users.data.remote

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface UsersApiService {
    @POST("users/device-token")
    suspend fun registerDeviceToken(@Body body: DeviceTokenRequest): Response<Unit>
}

data class DeviceTokenRequest(val token: String, val deviceId: String)
