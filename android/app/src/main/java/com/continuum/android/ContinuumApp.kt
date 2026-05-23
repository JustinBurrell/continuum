package com.continuum.android

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import coil3.ImageLoader
import coil3.PlatformContext
import coil3.SingletonImageLoader
import coil3.svg.SvgDecoder
import com.continuum.android.core.notification.InAppNotificationController
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class ContinuumApp : Application(), SingletonImageLoader.Factory {

    @Inject lateinit var inAppNotificationController: InAppNotificationController

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        ProcessLifecycleOwner.get().lifecycle.addObserver(object : DefaultLifecycleObserver {
            override fun onStart(owner: LifecycleOwner) {
                inAppNotificationController.isForegrounded = true
            }
            override fun onStop(owner: LifecycleOwner) {
                inAppNotificationController.isForegrounded = false
            }
        })
    }

    override fun newImageLoader(context: PlatformContext): ImageLoader =
        ImageLoader.Builder(context)
            .components { add(SvgDecoder.Factory()) }
            .build()

    private fun createNotificationChannels() {
        val nm = getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(
                "continuum_messages",
                "Direct Messages",
                NotificationManager.IMPORTANCE_HIGH
            )
        )
        nm.createNotificationChannel(
            NotificationChannel(
                "continuum_default",
                "Continuum",
                NotificationManager.IMPORTANCE_HIGH
            )
        )
    }
}
