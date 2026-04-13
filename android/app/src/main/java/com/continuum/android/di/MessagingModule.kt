package com.continuum.android.di

import com.continuum.android.feature.messaging.data.remote.MessagingApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object MessagingModule {

    @Provides
    @Singleton
    fun provideMessagingApiService(retrofit: Retrofit): MessagingApiService =
        retrofit.create(MessagingApiService::class.java)
}
