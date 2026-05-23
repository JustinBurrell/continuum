package com.continuum.android.core.notification

data class InAppNotification(
    val type: String,
    val actorName: String,
    val body: String,
    val data: Map<String, String>,
)
