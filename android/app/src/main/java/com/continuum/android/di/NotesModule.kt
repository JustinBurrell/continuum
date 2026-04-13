package com.continuum.android.di

import com.continuum.android.feature.notes.data.remote.NotesApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NotesModule {

    @Provides
    @Singleton
    fun provideNotesApiService(retrofit: Retrofit): NotesApiService =
        retrofit.create(NotesApiService::class.java)
}
