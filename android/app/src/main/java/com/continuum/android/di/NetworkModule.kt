package com.continuum.android.di

import com.continuum.android.core.network.ApiClient
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

/**
 * Provides network-layer dependencies: OkHttpClient, Retrofit, and API service interfaces.
 * Implementations live in core/network/ and are wired here.
 * Populated fully in Phase 6 (core architecture).
 */
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideRetrofit(): Retrofit = ApiClient.retrofit

}
