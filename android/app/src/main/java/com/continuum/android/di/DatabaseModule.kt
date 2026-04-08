package com.continuum.android.di

import android.content.Context
import androidx.room.Room
import com.continuum.android.core.data.local.AppDatabase
import com.continuum.android.core.data.local.FlashcardDao
import com.continuum.android.core.data.local.FlashcardSetDao
import com.continuum.android.core.data.local.NoteDao
import com.continuum.android.core.data.local.SyncQueueDao
import com.continuum.android.core.data.local.TaskDao
import com.continuum.android.core.data.local.UserDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Provides the Room database and all DAOs.
 * Each DAO is a singleton backed by the same [AppDatabase] instance.
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

    @Provides
    @Singleton
    fun provideNoteDao(db: AppDatabase): NoteDao = db.noteDao()

    @Provides
    @Singleton
    fun provideFlashcardSetDao(db: AppDatabase): FlashcardSetDao = db.flashcardSetDao()

    @Provides
    @Singleton
    fun provideFlashcardDao(db: AppDatabase): FlashcardDao = db.flashcardDao()

    @Provides
    @Singleton
    fun provideTaskDao(db: AppDatabase): TaskDao = db.taskDao()

    @Provides
    @Singleton
    fun provideUserDao(db: AppDatabase): UserDao = db.userDao()

    @Provides
    @Singleton
    fun provideSyncQueueDao(db: AppDatabase): SyncQueueDao = db.syncQueueDao()
}
