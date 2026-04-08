package com.continuum.android.di

import android.content.Context
import androidx.room.Room
import com.continuum.android.core.data.local.AppDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Provides Room database and all DAOs.
 * Populated fully in Phase 6 (core architecture).
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "continuum.db")
            .fallbackToDestructiveMigration()
            .build()

}
