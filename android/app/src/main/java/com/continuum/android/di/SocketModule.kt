package com.continuum.android.di

import com.continuum.android.core.network.SocketManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Provides the application-scoped Socket.io singleton.
 * Bound to SingletonComponent so the socket survives screen rotation.
 * Populated fully in Phase 6 (core architecture).
 */
@Module
@InstallIn(SingletonComponent::class)
object SocketModule {

    @Provides
    @Singleton
    fun provideSocketManager(): SocketManager = SocketManager()

}
