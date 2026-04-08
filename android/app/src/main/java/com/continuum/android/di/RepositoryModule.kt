package com.continuum.android.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/**
 * Binds repository interfaces to their implementations.
 * Entries are added here as each feature repository is built in Phase 8.
 */
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule
