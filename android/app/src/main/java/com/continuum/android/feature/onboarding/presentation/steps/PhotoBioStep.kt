package com.continuum.android.feature.onboarding.presentation.steps

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.continuum.android.core.ui.components.ContinuumButton
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.profile.data.repository.ProfileRepository
import com.continuum.android.feature.profile.domain.Profile
import kotlinx.coroutines.launch
import java.io.File

private const val MAX_FILE_SIZE = 5 * 1024 * 1024L // 5 MB
private val ACCEPTED_MIME = setOf("image/jpeg", "image/png", "image/webp", "image/gif")

@Composable
fun PhotoBioStep(
    profile: Profile,
    profileRepository: ProfileRepository,
    onContinue: () -> Unit,
    onSkip: () -> Unit,
) {
    var bio by remember { mutableStateOf(profile.bio ?: "") }
    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    var fileError by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val picker = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia()
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        val mime = context.contentResolver.getType(uri) ?: ""
        if (mime !in ACCEPTED_MIME) {
            fileError = "Only JPG, PNG, WebP, and GIF files are accepted."
            return@rememberLauncherForActivityResult
        }
        val size = context.contentResolver.openFileDescriptor(uri, "r")?.use { it.statSize } ?: 0L
        if (size > MAX_FILE_SIZE) {
            fileError = "File is too large. Maximum size is 5 MB."
            return@rememberLauncherForActivityResult
        }
        fileError = null
        selectedUri = uri
    }

    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            "Make it yours",
            style = MaterialTheme.typography.headlineSmall,
            color = TextPrimary,
            fontFamily = FrauncesFamily,
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "Add a photo and a short bio so friends can find you.",
            style = MaterialTheme.typography.bodySmall,
            color = TextSecondary,
        )
        Spacer(Modifier.height(16.dp))

        // Avatar picker row
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .border(2.dp, if (fileError != null) ErrorRed else Border, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                val imageModel: Any? = selectedUri ?: profile.avatarUrl
                if (imageModel != null) {
                    AsyncImage(
                        model = imageModel,
                        contentDescription = "Avatar",
                        modifier = Modifier.fillMaxSize().clip(CircleShape),
                        contentScale = ContentScale.Crop,
                    )
                } else {
                    Icon(Icons.Default.AddAPhoto, contentDescription = null, tint = TextMuted)
                }
            }
            Column {
                OutlinedButton(
                    onClick = { picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                    border = BorderStroke(1.dp, Border),
                ) {
                    Text(if (selectedUri != null) "Change photo" else "Upload photo", color = BrandPurple)
                }
                Text(
                    fileError ?: "JPG, PNG, WebP — max 5 MB",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (fileError != null) ErrorRed else TextMuted,
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = bio,
            onValueChange = { if (it.length <= 160) bio = it },
            label = { Text("Bio") },
            placeholder = { Text("A sentence or two about yourself…") },
            supportingText = {
                Text(
                    "${160 - bio.length} left",
                    color = if (bio.length >= 150) WarningAmber else TextMuted,
                )
            },
            maxLines = 4,
            modifier = Modifier.fillMaxWidth(),
            colors = onboardingTextFieldColors(),
        )

        Spacer(Modifier.height(16.dp))

        ContinuumButton(
            text = if (loading) "Saving…" else "Save & Continue",
            enabled = !loading && fileError == null,
            loading = loading,
            onClick = {
                loading = true
                scope.launch {
                    try {
                        if (selectedUri != null || bio != (profile.bio ?: "")) {
                            val fields = mutableMapOf<String, String>()
                            if (bio != (profile.bio ?: "")) fields["bio"] = bio

                            if (selectedUri != null) {
                                val inputStream = context.contentResolver.openInputStream(selectedUri!!)
                                val tempFile = File.createTempFile("avatar", ".tmp", context.cacheDir)
                                tempFile.outputStream().use { out -> inputStream?.copyTo(out) }
                                profileRepository.uploadAvatar(tempFile)
                                tempFile.delete()
                            } else if (fields.isNotEmpty()) {
                                profileRepository.updateProfileMultipart(fields)
                            }
                        }
                    } catch (_: Exception) { /* non-blocking */ }
                    loading = false
                    onContinue()
                }
            },
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onSkip, modifier = Modifier.fillMaxWidth()) {
            Text("Skip", color = TextMuted)
        }
    }
}
