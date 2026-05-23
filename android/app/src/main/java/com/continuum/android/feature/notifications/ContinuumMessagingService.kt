package com.continuum.android.feature.notifications

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput
import com.continuum.android.MainActivity
import com.continuum.android.R
import com.continuum.android.core.data.local.TokenManager
import com.continuum.android.feature.users.data.repository.UsersRepository
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class ContinuumMessagingService : FirebaseMessagingService() {

    @Inject lateinit var usersRepository: UsersRepository
    @Inject lateinit var tokenManager: TokenManager

    override fun onNewToken(token: String) {
        if (!tokenManager.isLoggedIn()) return
        CoroutineScope(Dispatchers.IO + SupervisorJob()).launch {
            usersRepository.registerFcmToken(token, tokenManager.getOrCreateDeviceId())
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val type = data["type"] ?: return
        // Only new_message is data-only — show a custom notification with Reply action.
        // All other types use notification+data; FCM auto-shows them in the background.
        if (type == "new_message") showMessageNotification(data)
    }

    private fun showMessageNotification(data: Map<String, String>) {
        val conversationId = data["targetId"] ?: return
        val title = data["actorName"]?.takeIf { it.isNotBlank() } ?: "New message"
        val body  = data["body"]?.takeIf { it.isNotBlank() } ?: "sent you a message"
        val notifId = conversationId.hashCode()

        val remoteInput = RemoteInput.Builder(QuickReplyReceiver.KEY_QUICK_REPLY)
            .setLabel("Reply…")
            .build()

        val replyIntent = Intent(this, QuickReplyReceiver::class.java).apply {
            putExtra(QuickReplyReceiver.EXTRA_CONVERSATION_ID, conversationId)
            putExtra(QuickReplyReceiver.EXTRA_NOTIFICATION_ID, notifId)
        }
        val replyPi = PendingIntent.getBroadcast(
            this, notifId, replyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            data.forEach { (k, v) -> putExtra(k, v) }
        }
        val openPi = PendingIntent.getActivity(
            this, notifId + 1, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, "continuum_messages")
            .setSmallIcon(R.drawable.ic_logo_symbol)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(openPi)
            .addAction(
                NotificationCompat.Action.Builder(
                    R.drawable.ic_logo_symbol, "Reply", replyPi
                ).addRemoteInput(remoteInput).build()
            )
            .build()

        try {
            NotificationManagerCompat.from(this).notify(notifId, notification)
        } catch (_: SecurityException) {}
    }
}
