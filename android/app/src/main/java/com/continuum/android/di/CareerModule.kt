package com.continuum.android.di

import com.continuum.android.feature.career.data.remote.CareerApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object CareerModule {

    @Provides
    @Singleton
    fun provideCareerApiService(retrofit: Retrofit): CareerApiService =
        retrofit.create(CareerApiService::class.java)
}
