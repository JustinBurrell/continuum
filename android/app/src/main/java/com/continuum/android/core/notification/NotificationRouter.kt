package com.continuum.android.core.notification

import com.continuum.android.core.ui.navigation.resolveNavFromFcm
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRouter @Inject constructor() {

    private val _destination = MutableSharedFlow<String>(
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )
    val destination: SharedFlow<String> = _destination.asSharedFlow()

    fun route(route: String) {
        if (route.isNotBlank()) _destination.tryEmit(route)
    }

    fun routeFromFcmData(data: Map<String, String>) {
        val route = resolveNavFromFcm(data)
        if (route.isNotBlank()) _destination.tryEmit(route)
    }

    // Cold-start pending route: set before the NavHost is composed, consumed once auth is confirmed.
    private var pendingRoute: String? = null

    fun storePendingFromFcmData(data: Map<String, String>) {
        val route = resolveNavFromFcm(data)
        if (route.isNotBlank()) pendingRoute = route
    }

    fun consumePendingRoute(): String? = pendingRoute?.also { pendingRoute = null }
}
