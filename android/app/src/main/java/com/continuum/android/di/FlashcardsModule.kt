package com.continuum.android.di

import com.continuum.android.feature.flashcards.data.remote.FlashcardsApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object FlashcardsModule {

    @Provides
    @Singleton
    fun provideFlashcardsApiService(retrofit: Retrofit): FlashcardsApiService =
        retrofit.create(FlashcardsApiService::class.java)
}
