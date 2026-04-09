package com.continuum.android.feature.auth.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.res.painterResource
import com.continuum.android.R
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

@Composable
fun RegisterScreen(
    onRegisterSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit,
    onNavigateToPrivacy: () -> Unit,
    onNavigateToTerms: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onRegisterSuccess()
            viewModel.resetState()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PageBackground)
            .windowInsetsPadding(WindowInsets.safeDrawing)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        androidx.compose.foundation.Image(
            painter = painterResource(R.drawable.ic_logo_wordmark),
            contentDescription = "Continuum",
            colorFilter = ColorFilter.tint(BrandPurple),
            modifier = Modifier.width(200.dp).height(48.dp)
        )
        Spacer(Modifier.height(32.dp))

        ContinuumCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Create your account",
                    style = MaterialTheme.typography.headlineLarge,
                    color = TextPrimary
                )
                Text(
                    text = "Join Continuum and start learning smarter",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    ContinuumTextField(
                        value = firstName,
                        onValueChange = { firstName = it },
                        label = "First name",
                        modifier = Modifier.weight(1f)
                    )
                    ContinuumTextField(
                        value = lastName,
                        onValueChange = { lastName = it },
                        label = "Last name",
                        modifier = Modifier.weight(1f)
                    )
                }

                ContinuumTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = "Username",
                    placeholder = "yourhandle"
                )

                ContinuumTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = "Email",
                    placeholder = "your@email.com",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
                )

                ContinuumTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Password",
                    placeholder = "••••••••",
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = null,
                                tint = TextSecondary
                            )
                        }
                    }
                )

                Column {
                    Text(
                        text = "By creating an account you agree to our",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        TextButton(onClick = onNavigateToTerms, contentPadding = PaddingValues(4.dp)) {
                            Text("Terms of Service", color = BrandPurple, style = MaterialTheme.typography.bodySmall)
                        }
                        Text("and", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                        TextButton(onClick = onNavigateToPrivacy, contentPadding = PaddingValues(4.dp)) {
                            Text("Privacy Policy", color = BrandPurple, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }

                if (uiState is AuthUiState.Error) {
                    Text(
                        text = (uiState as AuthUiState.Error).message,
                        color = ErrorRed,
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                ContinuumButton(
                    text = "Create account",
                    onClick = {
                        viewModel.register(
                            firstName.trim(), lastName.trim(),
                            username.trim(), email.trim(), password
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = firstName.isNotBlank() && lastName.isNotBlank() &&
                        username.isNotBlank() && email.isNotBlank() && password.isNotBlank(),
                    loading = uiState is AuthUiState.Loading
                )
            }
        }

        Spacer(Modifier.height(24.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "Already have an account?",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )
            TextButton(onClick = onNavigateToLogin, contentPadding = PaddingValues(4.dp)) {
                Text("Sign in", color = BrandPurple, style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}
