package com.continuum.android.feature.auth.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*

@Composable
fun VerifyEmailScreen(
    token: String,
    onContinueToApp: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LaunchedEffect(token) {
        if (token.isNotBlank()) viewModel.verifyEmail(token)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBackground)
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .padding(horizontal = 32.dp),
        contentAlignment = Alignment.Center
    ) {
        when (uiState) {
            is AuthUiState.Loading -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    CircularProgressIndicator(color = BrandPurple)
                    Text(
                        "Verifying your email...",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }
            }

            is AuthUiState.Done -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = SuccessGreen,
                        modifier = Modifier.size(72.dp)
                    )
                    Text(
                        "Email verified",
                        style = MaterialTheme.typography.headlineLarge,
                        color = TextPrimary,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "Your email has been confirmed. Welcome to Continuum!",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(8.dp))
                    ContinuumButton(
                        text = "Continue to Continuum",
                        onClick = {
                            viewModel.resetState()
                            onContinueToApp()
                        },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            is AuthUiState.Error -> {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.ErrorOutline,
                        contentDescription = null,
                        tint = ErrorRed,
                        modifier = Modifier.size(72.dp)
                    )
                    Text(
                        "Verification failed",
                        style = MaterialTheme.typography.headlineLarge,
                        color = TextPrimary,
                        textAlign = TextAlign.Center
                    )
                    Text(
                        "The link may have expired. Request a new verification email.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(8.dp))
                    ContinuumButton(
                        text = "Resend verification email",
                        onClick = { viewModel.resetState() },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            else -> {
                // token is blank — show generic prompt
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    CircularProgressIndicator(color = BrandPurple)
                }
            }
        }
    }
}
