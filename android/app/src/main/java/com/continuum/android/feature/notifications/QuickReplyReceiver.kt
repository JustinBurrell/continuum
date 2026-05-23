package com.continuum.android.feature.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput
import com.continuum.android.R
import com.continuum.android.feature.messaging.data.repository.MessagingRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class QuickReplyReceiver : BroadcastReceiver() {

    @Inject lateinit var messagingRepository: MessagingRepository

    override fun onReceive(context: Context, intent: Intent) {
        val text = RemoteInput.getResultsFromIntent(intent)
            ?.getCharSequence(KEY_QUICK_REPLY)?.toString()?.trim() ?: return
        val conversationId = intent.getStringExtra(EXTRA_CONVERSATION_ID) ?: return
        val notifId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, 0)

        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                messagingRepository.sendMessage(conversationId, text)
                val sent = NotificationCompat.Builder(context, "continuum_messages")
                    .setSmallIcon(R.drawable.ic_logo_symbol)
                    .setContentText("Reply sent")
                    .setAutoCancel(true)
                    .build()
                try {
                    NotificationManagerCompat.from(context).notify(notifId, sent)
                } catch (_: SecurityException) {}
            } finally {
                pending.finish()
            }
        }
    }

    companion object {
        const val KEY_QUICK_REPLY = "quick_reply_text"
        const val EXTRA_CONVERSATION_ID = "conversationId"
        const val EXTRA_NOTIFICATION_ID = "notificationId"
    }
}
