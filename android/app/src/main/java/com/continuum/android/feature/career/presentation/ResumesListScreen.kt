package com.continuum.android.feature.career.presentation

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.career.domain.Resume
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.PullToRefreshBox

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResumesListScreen(
    onResumeClick: (String) -> Unit,
    viewModel: CareerViewModel = hiltViewModel()
) {
    val state by viewModel.resumesState.collectAsStateWithLifecycle()
    val context = LocalContext.current
    var resumeToDelete by remember { mutableStateOf<Resume?>(null) }

    LaunchedEffect(Unit) { viewModel.loadResumes() }

    val filePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        val fileName = uri.lastPathSegment?.substringAfterLast("/") ?: "resume.pdf"
        viewModel.uploadResume(context, uri, fileName)
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            InlineScreenHeader(title = "Resumes")

            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = viewModel::setResumesSearchQuery,
                placeholder = { Text("Search by file name or role...") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                leadingIcon = { Icon(Icons.Default.Search, null, tint = TextSecondary) },
                trailingIcon = {
                    if (state.searchQuery.isNotBlank()) {
                        IconButton(onClick = { viewModel.setResumesSearchQuery("") }) {
                            Icon(Icons.Default.Close, null, tint = TextSecondary)
                        }
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BrandPurple,
                    unfocusedBorderColor = Border
                )
            )

            PullToRefreshBox(
                isRefreshing = state.isLoading,
                onRefresh = { viewModel.loadResumes() },
                modifier = Modifier.weight(1f)
            ) {
                when {
                    state.isUploading -> {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                CircularProgressIndicator(color = BrandPurple)
                                Spacer(Modifier.height(8.dp))
                                Text("Uploading resume...", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                            }
                        }
                    }

                    state.isLoading && state.resumes.isEmpty() -> {
                        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(3) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(80.dp)) }
                        }
                    }

                    state.resumes.isEmpty() -> {
                        EmptyState(
                            icon = Icons.Default.Description,
                            headline = "No resumes yet",
                            subtext = "Upload your first resume to get AI feedback",
                            actionLabel = "Upload PDF",
                            onAction = { filePicker.launch("application/pdf") },
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    else -> {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(state.resumes, key = { it.id }) { resume ->
                                ResumeCard(
                                    resume = resume,
                                    onClick = { onResumeClick(resume.id) },
                                    onDelete = { resumeToDelete = resume }
                                )
                            }
                        }
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { filePicker.launch("application/pdf") },
            containerColor = BrandPurple,
            contentColor = White,
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp)
        ) {
            Icon(Icons.Default.Upload, "Upload resume")
        }
    }

    resumeToDelete?.let { resume ->
        AlertDialog(
            onDismissRequest = { resumeToDelete = null },
            title = { Text("Delete resume?") },
            text = { Text("\"${resume.fileName}\" will be permanently deleted.") },
            confirmButton = {
                TextButton(onClick = { viewModel.deleteResume(resume.id); resumeToDelete = null }) {
                    Text("Delete", color = ErrorRed)
                }
            },
            dismissButton = { TextButton(onClick = { resumeToDelete = null }) { Text("Cancel") } }
        )
    }
}

@Composable
private fun ResumeCard(resume: Resume, onClick: () -> Unit, onDelete: () -> Unit) {
    val swipeToDismissState = rememberSwipeToDismissBoxState(
        confirmValueChange = { value ->
            if (value == SwipeToDismissBoxValue.EndToStart) { onDelete(); false } else false
        }
    )

    SwipeToDismissBox(
        state = swipeToDismissState,
        backgroundContent = {
            Box(Modifier.fillMaxSize().padding(end = 16.dp), contentAlignment = Alignment.CenterEnd) {
                Icon(Icons.Default.Delete, null, tint = ErrorRed)
            }
        },
        enableDismissFromStartToEnd = false
    ) {
        ContinuumCard(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.PictureAsPdf, null, tint = BrandPurple, modifier = Modifier.size(36.dp))
                    Column {
                        Text(resume.fileName, style = MaterialTheme.typography.headlineSmall, color = TextPrimary, maxLines = 1)
                        Text("${resume.targetRole} · v${resume.version}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                        Text(resume.uploadDate.take(10), style = MaterialTheme.typography.bodySmall, color = TextMuted)
                    }
                }
                resume.aiScore?.let { score ->
                    Text(
                        text = "$score",
                        style = MaterialTheme.typography.headlineMedium,
                        color = BrandPurple
                    )
                }
            }
        }
    }
}
