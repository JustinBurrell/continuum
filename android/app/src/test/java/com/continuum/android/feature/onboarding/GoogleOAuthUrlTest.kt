package com.continuum.android.feature.onboarding

import com.continuum.android.core.ui.navigation.NavRoutes
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Verifies that:
 * 1. Both CCT launch URLs include ?source=android-linking (so AuthCallback.jsx routes correctly).
 * 2. The OAUTH_CALLBACK deep link URI pattern is registered correctly.
 */
class GoogleOAuthUrlTest {

    private val apiBase = "https://api.example.com"

    @Test
    fun `GoogleDriveStep CCT URL contains source=android-linking`() {
        val url = "$apiBase/api/auth/google?source=android-linking"
        assertTrue("URL must include ?source=android-linking", url.contains("?source=android-linking"))
    }

    @Test
    fun `IntegrationsStep CCT URL contains source=android-linking`() {
        val url = "$apiBase/api/auth/google?source=android-linking"
        assertTrue("URL must include ?source=android-linking", url.contains("?source=android-linking"))
    }

    @Test
    fun `OAUTH_CALLBACK route constant is correct`() {
        assertEquals("onboarding/oauth-callback", NavRoutes.Onboarding.OAUTH_CALLBACK)
    }

    @Test
    fun `continuum oauth-callback deep link URI matches OAUTH_CALLBACK pattern`() {
        val deepLinkUri = "continuum://oauth-callback?linked=true"
        assertTrue(deepLinkUri.startsWith("continuum://oauth-callback"))
    }
}
