package com.continuum.android.feature.users.data.repository

import com.continuum.android.feature.users.data.remote.DeviceTokenRequest
import com.continuum.android.feature.users.data.remote.UsersApiService
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UsersRepository @Inject constructor(
    private val api: UsersApiService,
) {
    suspend fun registerFcmToken(token: String, deviceId: String) {
        runCatching { api.registerDeviceToken(DeviceTokenRequest(token, deviceId)) }
    }
}
