package com.continuum.android.core

import com.continuum.android.core.network.friendlyError
import org.junit.Assert.assertEquals
import org.junit.Test

class ErrorUtilsTest {

    @Test
    fun `friendlyError maps known credential error`() {
        val e = RuntimeException("Invalid credentials")
        assertEquals("Incorrect email or password.", friendlyError(e))
    }

    @Test
    fun `friendlyError maps email already registered`() {
        val e = RuntimeException("Email already registered")
        assertEquals("An account with this email already exists.", friendlyError(e))
    }

    @Test
    fun `friendlyError maps username taken`() {
        val e = RuntimeException("Username already taken")
        assertEquals("This username is not available.", friendlyError(e))
    }

    @Test
    fun `friendlyError maps internal server error`() {
        val e = RuntimeException("Internal server error")
        assertEquals("Something went wrong on our end. Please try again.", friendlyError(e))
    }

    @Test
    fun `friendlyError maps token expired`() {
        val e = RuntimeException("Token expired")
        assertEquals("Your session has expired. Please sign in again.", friendlyError(e))
    }

    @Test
    fun `friendlyError maps user not found`() {
        val e = RuntimeException("User not found")
        assertEquals("No account found with that email address.", friendlyError(e))
    }

    @Test
    fun `friendlyError returns fallback for unmapped message`() {
        val e = RuntimeException("Some totally unknown error")
        assertEquals("Something totally unknown error", friendlyError(e, "Something totally unknown error"))
    }

    @Test
    fun `friendlyError returns custom fallback when message is blank`() {
        val e = RuntimeException("")
        assertEquals("Custom fallback", friendlyError(e, "Custom fallback"))
    }

    @Test
    fun `friendlyError strips colon prefix from message`() {
        // RuntimeException messages from Retrofit can include "HTTP 401 : Unauthorized"
        val e = RuntimeException("HTTP 401 : User not found")
        assertEquals("No account found with that email address.", friendlyError(e))
    }

    @Test
    fun `friendlyError maps incorrect password`() {
        val e = RuntimeException("Incorrect password")
        assertEquals("The current password you entered is incorrect.", friendlyError(e))
    }
}
