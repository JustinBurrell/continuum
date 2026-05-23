package com.continuum.android.core.notification

import com.continuum.android.core.ui.navigation.resolveNavFromFcm
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InAppNotificationController @Inject constructor() {

    // True when the app process is in the foreground (updated by ProcessLifecycleOwner in ContinuumApp)
    var isForegrounded: Boolean = false

    private val _currentRoute = MutableStateFlow("")
    val currentRoute: StateFlow<String> = _currentRoute.asStateFlow()

    private val _banner = MutableSharedFlow<InAppNotification>(
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )
    val banner: SharedFlow<InAppNotification> = _banner.asSharedFlow()

    fun updateCurrentRoute(route: String) {
        _currentRoute.value = route
    }

    /**
     * Called by ContinuumMessagingService for every incoming FCM message.
     * Returns true if the service should show a system tray notification
     * (i.e. the app is backgrounded and must handle display itself for data-only messages).
     * Returns false if the notification was handled in-app (banner shown or suppressed).
     */
    fun handle(data: Map<String, String>): Boolean {
        if (!isForegrounded) return true

        val type = data["type"] ?: return false

        // Determine the primary resource ID so we can check if the user is already on that screen
        val primaryId = when (type) {
            "comment_reply", "like_added", "mention" -> data["resourceId"]
            else -> data["targetId"]
        }

        // Suppress entirely if the user is already viewing the target screen
        if (!primaryId.isNullOrBlank() && _currentRoute.value.contains(primaryId)) {
            return false
        }

        // Foregrounded and on a different screen — emit to the in-app banner
        val actorName = data["actorName"]?.takeIf { it.isNotBlank() } ?: "Continuum"
        val body = data["body"]?.takeIf { it.isNotBlank() }
            ?: data["message"]?.takeIf { it.isNotBlank() }
            ?: ""
        _banner.tryEmit(InAppNotification(type, actorName, body, data))
        return false
    }
}
