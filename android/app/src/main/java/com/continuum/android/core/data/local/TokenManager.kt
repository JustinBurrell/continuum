package com.continuum.android.core.data.local

import android.content.Context
import android.util.Base64
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

enum class LogoutReason { USER_INITIATED, REMOTE_INVALIDATION }

@Singleton
class TokenManager @Inject constructor(@ApplicationContext context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "continuum_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private val _logoutEvent = MutableSharedFlow<LogoutReason>(extraBufferCapacity = 1)
    val logoutEvent: SharedFlow<LogoutReason> = _logoutEvent.asSharedFlow()

    /** Reactive session flag so UI can reload nav profile after login and clear on logout. */
    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    init {
        _isLoggedIn.value = getAccessToken() != null
    }

    fun saveTokens(jwt: String, refreshToken: String) {
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, jwt)
            .putString(KEY_REFRESH_TOKEN, refreshToken)
            .apply()
        _isLoggedIn.value = true
    }

    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun clearTokens(reason: LogoutReason = LogoutReason.USER_INITIATED) {
        prefs.edit()
            .remove(KEY_ACCESS_TOKEN)
            .remove(KEY_REFRESH_TOKEN)
            .apply()
        _isLoggedIn.value = false
        _logoutEvent.tryEmit(reason)
    }

    /** Decodes `userId` from the JWT access token payload (no signature verification). */
    fun getJwtUserId(): String? {
        val token = getAccessToken() ?: return null
        val parts = token.split('.')
        if (parts.size < 2) return null
        var payload = parts[1]
        val rem = payload.length % 4
        if (rem > 0) payload += "=".repeat(4 - rem)
        return try {
            val json = String(Base64.decode(payload, Base64.URL_SAFE), Charsets.UTF_8)
            JSONObject(json).optString("userId").takeIf { it.isNotBlank() }
        } catch (_: Exception) {
            null
        }
    }

    fun isLoggedIn(): Boolean = getAccessToken() != null

    fun getOrCreateDeviceId(): String =
        prefs.getString(KEY_DEVICE_ID, null) ?: UUID.randomUUID().toString().also {
            prefs.edit().putString(KEY_DEVICE_ID, it).apply()
        }

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_DEVICE_ID = "device_id"
    }
}
