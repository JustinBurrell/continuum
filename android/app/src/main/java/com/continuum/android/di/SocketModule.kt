package com.continuum.android.di

import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/**
 * SocketManager uses @Singleton + @Inject constructor, so Hilt wires it
 * automatically without an explicit @Provides method.
 * This module is retained as a home for any future socket-layer configuration.
 */
@Module
@InstallIn(SingletonComponent::class)
object SocketModule
