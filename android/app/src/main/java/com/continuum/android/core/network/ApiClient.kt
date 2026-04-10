package com.continuum.android.core.network

import com.continuum.android.BuildConfig
import com.continuum.android.core.data.local.LogoutReason
import com.continuum.android.core.data.local.TokenManager
import okhttp3.Authenticator
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONObject
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton
import okhttp3.Interceptor
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory

/**
 * Adds Authorization: Bearer <token> and X-Client-Type: android to every request.
 */
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {
    private val deviceUserAgent: String by lazy {
        val manufacturer = android.os.Build.MANUFACTURER.replaceFirstChar { it.uppercase() }
        val model = android.os.Build.MODEL
        val androidVersion = android.os.Build.VERSION.RELEASE
        "ContinuumAndroid/${com.continuum.android.BuildConfig.VERSION_NAME} ($manufacturer $model; Android $androidVersion)"
    }

    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenManager.getAccessToken()
        val request = chain.request().newBuilder()
            .addHeader("X-Client-Type", "android")
            .header("User-Agent", deviceUserAgent)
            .apply { token?.let { addHeader("Authorization", "Bearer $it") } }
            .build()
        return chain.proceed(request)
    }
}

class RateLimitInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val response = chain.proceed(chain.request())
        if (response.code == 429) {
            response.close()
            throw java.io.IOException("Too many requests. Please wait a moment and try again.")
        }
        return response
    }
}

/**
 * OkHttp Authenticator that handles 401 responses by calling POST /api/auth/mobile/refresh.
 * On success: updates stored tokens and retries the original request.
 * On failure: clears tokens (triggers navigation to login via TokenManager state).
 */
class TokenAuthenticator @Inject constructor(
    private val tokenManager: TokenManager
) : Authenticator {

    // Guard against retry loops — if we already retried after refresh, stop.
    override fun authenticate(route: Route?, response: Response): Request? {
        if (response.request.header("X-Retry-After-Refresh") != null) return null

        synchronized(this) {
            val refreshToken = tokenManager.getRefreshToken() ?: return null

            val refreshClient = OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build()

            val body = JSONObject().apply {
                put("refreshToken", refreshToken)
            }.toString().toRequestBody("application/json".toMediaType())

            val refreshRequest = Request.Builder()
                .url("${BuildConfig.BASE_URL}auth/mobile/refresh")
                .post(body)
                .addHeader("X-Client-Type", "android")
                .build()

            return try {
                val refreshResponse = refreshClient.newCall(refreshRequest).execute()
                if (refreshResponse.isSuccessful) {
                    val responseBody = refreshResponse.body?.string() ?: return null
                    val json = JSONObject(responseBody)
                    val newJwt = json.optString("token").takeIf { it.isNotBlank() } ?: return null
                    val newRefresh = json.optString("refreshToken").takeIf { it.isNotBlank() } ?: return null
                    tokenManager.saveTokens(newJwt, newRefresh)
                    response.request.newBuilder()
                        .header("Authorization", "Bearer $newJwt")
                        .header("X-Retry-After-Refresh", "true")
                        .build()
                } else {
                    tokenManager.clearTokens(LogoutReason.REMOTE_INVALIDATION)
                    null
                }
            } catch (e: Exception) {
                tokenManager.clearTokens(LogoutReason.REMOTE_INVALIDATION)
                null
            }
        }
    }
}

/**
 * Factory singleton for building the shared OkHttpClient and Retrofit instance.
 * Dependencies are injected via NetworkModule so DI graph owns the lifecycle.
 */
@Singleton
class ApiClient @Inject constructor(
    private val authInterceptor: AuthInterceptor,
    private val tokenAuthenticator: TokenAuthenticator
) {

    val moshi: Moshi = Moshi.Builder()
        .addLast(KotlinJsonAdapterFactory())
        .build()

    val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(authInterceptor)
            .addInterceptor(RateLimitInterceptor())
            .authenticator(tokenAuthenticator)
            .apply {
                if (BuildConfig.DEBUG) {
                    addInterceptor(
                        HttpLoggingInterceptor().apply {
                            level = HttpLoggingInterceptor.Level.BODY
                        }
                    )
                }
            }
            .build()
    }

    val retrofit: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }
}
