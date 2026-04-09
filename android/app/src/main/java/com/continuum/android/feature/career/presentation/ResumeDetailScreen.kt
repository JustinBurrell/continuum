package com.continuum.android.feature.career.presentation

import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File

@Composable
fun ResumeDetailScreen(
    resumeId: String,
    onNavigateBack: () -> Unit,
    onGetFeedback: () -> Unit,
    viewModel: CareerViewModel = hiltViewModel()
) {
    val state by viewModel.resumesState.collectAsStateWithLifecycle()
    val resume = state.resumes.find { it.id == resumeId }
    val context = LocalContext.current

    var pdfBitmaps by remember { mutableStateOf<List<android.graphics.Bitmap>>(emptyList()) }
    var isLoadingPdf by remember { mutableStateOf(true) }

    LaunchedEffect(resume?.cloudinaryUrl) {
        val url = resume?.cloudinaryUrl ?: return@LaunchedEffect
        isLoadingPdf = true
        pdfBitmaps = withContext(Dispatchers.IO) {
            try {
                val client = OkHttpClient()
                val response = client.newCall(Request.Builder().url(url).build()).execute()
                val bytes = response.body?.bytes() ?: return@withContext emptyList()
                val tempFile = File(context.cacheDir, "resume_$resumeId.pdf").apply { writeBytes(bytes) }
                val parcel = ParcelFileDescriptor.open(tempFile, ParcelFileDescriptor.MODE_READ_ONLY)
                val renderer = PdfRenderer(parcel)
                val bitmaps = (0 until renderer.pageCount).map { i ->
                    val page = renderer.openPage(i)
                    val bitmap = android.graphics.Bitmap.createBitmap(page.width * 2, page.height * 2, android.graphics.Bitmap.Config.ARGB_8888)
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    page.close()
                    bitmap
                }
                renderer.close()
                parcel.close()
                bitmaps
            } catch (_: Exception) { emptyList() }
        }
        isLoadingPdf = false
    }

    LaunchedEffect(Unit) { if (state.resumes.isEmpty()) viewModel.loadResumes() }

    Scaffold(
        topBar = {
            PurpleTopAppBar(
                title = resume?.fileName ?: "Resume",
                onNavigateBack = onNavigateBack,
                actions = {
                    TextButton(onClick = onGetFeedback) {
                        Text("AI Feedback", color = androidx.compose.ui.graphics.Color.White)
                    }
                }
            )
        }
    ) { innerPadding ->
        when {
            isLoadingPdf -> {
                Box(Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = BrandPurple)
                        Spacer(Modifier.height(8.dp))
                        Text("Loading resume...", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    }
                }
            }

            pdfBitmaps.isEmpty() -> {
                EmptyState(
                    icon = Icons.Default.ErrorOutline,
                    headline = "Could not load PDF",
                    subtext = "The resume could not be displayed",
                    modifier = Modifier.fillMaxSize().padding(innerPadding)
                )
            }

            else -> {
                LazyColumn(
                    contentPadding = PaddingValues(8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxSize().padding(innerPadding)
                ) {
                    itemsIndexed(pdfBitmaps) { _, bitmap ->
                        Image(
                            bitmap = bitmap.asImageBitmap(),
                            contentDescription = "Resume page",
                            modifier = Modifier.fillMaxWidth(),
                            contentScale = ContentScale.FillWidth
                        )
                    }
                }
            }
        }
    }
}
