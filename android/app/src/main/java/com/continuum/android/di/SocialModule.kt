package com.continuum.android.di

import com.continuum.android.feature.social.data.remote.SocialApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object SocialModule {

    @Provides
    @Singleton
    fun provideSocialApiService(retrofit: Retrofit): SocialApiService =
        retrofit.create(SocialApiService::class.java)
}
