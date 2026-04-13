package com.continuum.android.core.network

import org.json.JSONObject
import retrofit2.HttpException

private val ERROR_MAP = mapOf(
    "Invalid credentials" to "Incorrect email or password.",
    "Email already registered" to "An account with this email already exists.",
    "Username already taken" to "This username is not available.",
    "Email is required" to "Please enter your email address.",
    "Password is required" to "Please enter your password.",
    "User not found" to "No account found with that email address.",
    "Account not verified" to "Please verify your email before signing in.",
    "Token expired" to "Your session has expired. Please sign in again.",
    "Invalid token" to "Your session is invalid. Please sign in again.",
    "Incorrect password" to "The current password you entered is incorrect.",
    "Internal server error" to "Something went wrong on our end. Please try again.",
    "Internal Server Error" to "Something went wrong on our end. Please try again."
)

fun friendlyError(t: Throwable, fallback: String = "Something went wrong. Please try again."): String {
    if (t is HttpException) {
        val body = try { t.response()?.errorBody()?.string() } catch (_: Exception) { null }
        if (body != null) {
            val errorMsg = try { JSONObject(body).optString("error", "") } catch (_: Exception) { "" }
            if (errorMsg.isNotBlank()) {
                return ERROR_MAP[errorMsg] ?: errorMsg
            }
        }
        if (t.code() == 429) return "Too many requests. Please wait a moment and try again."
    }
    val raw = t.message ?: return fallback
    val cleaned = raw.substringAfter(":").trim().ifBlank { null } ?: return fallback
    return ERROR_MAP[cleaned] ?: cleaned
}
