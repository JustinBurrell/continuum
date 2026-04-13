package com.continuum.android.core.network

import com.continuum.android.BuildConfig
import com.continuum.android.core.data.local.TokenManager
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Application-scoped Socket.io singleton.
 *
 * - Connects with `auth: { token: <JWT> }` in the handshake, matching the web client.
 * - Reconnects automatically on network restore — call [onNetworkAvailable] from a
 *   NetworkMonitor observer (wired in AppNavHost or Application).
 * - ViewModels collect from the exposed [SharedFlow]s and never register socket
 *   listeners directly.
 *
 * Event payloads are raw JSON strings. Feature repositories parse them into
 * domain models when consuming each flow.
 */
@Singleton
class SocketManager @Inject constructor(
    private val tokenManager: TokenManager
) {

    private var socket: Socket? = null

    // ---------------------------------------------------------------------------
    // Public event flows — one per backend socket event
    // ---------------------------------------------------------------------------

    private val _newMessageFlow = MutableSharedFlow<String>(extraBufferCapacity = 64)
    val newMessageFlow: SharedFlow<String> = _newMessageFlow.asSharedFlow()

    private val _friendRequestFlow = MutableSharedFlow<String>(extraBufferCapacity = 32)
    val friendRequestFlow: SharedFlow<String> = _friendRequestFlow.asSharedFlow()

    private val _taskUpdatedFlow = MutableSharedFlow<String>(extraBufferCapacity = 64)
    val taskUpdatedFlow: SharedFlow<String> = _taskUpdatedFlow.asSharedFlow()

    private val _activityUpdatedFlow = MutableSharedFlow<String>(extraBufferCapacity = 64)
    val activityUpdatedFlow: SharedFlow<String> = _activityUpdatedFlow.asSharedFlow()

    private val _noteUpdatedFlow = MutableSharedFlow<String>(extraBufferCapacity = 64)
    val noteUpdatedFlow: SharedFlow<String> = _noteUpdatedFlow.asSharedFlow()

    // ---------------------------------------------------------------------------
    // Lifecycle
    // ---------------------------------------------------------------------------

    /**
     * Establishes the socket connection. Safe to call multiple times — skips
     * if the socket is already connected.
     */
    fun connect() {
        if (socket?.connected() == true) return
        val token = tokenManager.getAccessToken() ?: return

        // Strip the /api/ path suffix — socket connects to the root server URL.
        val serverUrl = BuildConfig.BASE_URL
            .removeSuffix("/")
            .removeSuffix("/api")

        val opts = IO.Options.builder()
            .setAuth(mapOf("token" to token))
            .setReconnection(true)
            .setReconnectionAttempts(Int.MAX_VALUE)
            .setReconnectionDelay(1_000)
            .setReconnectionDelayMax(5_000)
            .build()

        socket = IO.socket(serverUrl, opts).apply {
            on(Socket.EVENT_CONNECT) { /* connected — no-op, reconnection is automatic */ }
            on(Socket.EVENT_CONNECT_ERROR) { /* log in debug builds if needed */ }

            on("new_message") { args ->
                args.firstOrNull()?.let { _newMessageFlow.tryEmit(it.toString()) }
            }
            on("friend_request") { args ->
                args.firstOrNull()?.let { _friendRequestFlow.tryEmit(it.toString()) }
            }
            on("task_updated") { args ->
                args.firstOrNull()?.let { _taskUpdatedFlow.tryEmit(it.toString()) }
            }
            on("activity_updated") { args ->
                args.firstOrNull()?.let { _activityUpdatedFlow.tryEmit(it.toString()) }
            }
            on("note_updated") { args ->
                args.firstOrNull()?.let { _noteUpdatedFlow.tryEmit(it.toString()) }
            }

            connect()
        }
    }

    /**
     * Disconnects the socket. Call on logout or app teardown.
     */
    fun disconnect() {
        socket?.disconnect()
        socket = null
    }

    /**
     * Called by the NetworkMonitor observer when connectivity is restored.
     * Re-establishes the socket connection if not already connected.
     */
    fun onNetworkAvailable() {
        if (socket?.connected() != true) {
            connect()
        }
    }
}
