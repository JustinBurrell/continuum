package com.continuum.android.di

import com.continuum.android.feature.tasks.data.remote.TasksApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object TasksModule {

    @Provides
    @Singleton
    fun provideTasksApiService(retrofit: Retrofit): TasksApiService =
        retrofit.create(TasksApiService::class.java)
}
