package com.continuum.android.di

import com.continuum.android.core.network.ApiClient
import com.continuum.android.core.network.NetworkMonitor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import javax.inject.Singleton

/**
 * Provides network-layer singletons: OkHttpClient, Retrofit, and NetworkMonitor.
 * [ApiClient] wires AuthInterceptor + TokenAuthenticator into the OkHttp stack.
 * [NetworkMonitor] is auto-created by Hilt via @Inject constructor; listed here
 * only for documentation — no explicit @Provides needed for it or for ApiClient.
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideOkHttpClient(apiClient: ApiClient): OkHttpClient = apiClient.okHttpClient

    @Provides
    @Singleton
    fun provideRetrofit(apiClient: ApiClient): Retrofit = apiClient.retrofit
}
