package com.continuum.android.feature.career.presentation

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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

private val statusOptions = listOf("saved", "applied", "interview", "offer", "rejected")

@Composable
fun ApplicationDetailScreen(
    appId: String,
    onNavigateBack: () -> Unit,
    onViewResume: (String) -> Unit,
    viewModel: CareerViewModel = hiltViewModel()
) {
    val state by viewModel.applicationsState.collectAsStateWithLifecycle()
    val app = state.applications.find { it.id == appId }
    val context = LocalContext.current

    var notes by remember(app?.notes) { mutableStateOf(app?.notes ?: "") }
    var showStatusDropdown by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { if (state.applications.isEmpty()) viewModel.loadApplications() }

    Scaffold(
        topBar = {
            PurpleTopAppBar(
                title = app?.company ?: "Application",
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = androidx.compose.ui.graphics.Color.White)
                    }
                }
            )
        }
    ) { innerPadding ->
        if (app == null) {
            Box(Modifier.fillMaxSize().padding(innerPadding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandPurple)
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(app.position, style = MaterialTheme.typography.headlineLarge, color = TextPrimary)
                    Text(app.company, style = MaterialTheme.typography.bodyLarge, color = TextSecondary)
                    app.appliedDate?.let { Text("Applied: ${it.take(10)}", style = MaterialTheme.typography.bodySmall, color = TextMuted) }

                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatusBadge(status = app.status)
                        Box {
                            TextButton(onClick = { showStatusDropdown = true }) {
                                Text("Change status", color = BrandPurple)
                                Icon(Icons.Default.ArrowDropDown, null, tint = BrandPurple)
                            }
                            DropdownMenu(expanded = showStatusDropdown, onDismissRequest = { showStatusDropdown = false }) {
                                statusOptions.forEach { option ->
                                    DropdownMenuItem(
                                        text = { Text(option.replaceFirstChar { it.uppercase() }) },
                                        onClick = {
                                            viewModel.updateApplicationStatus(appId, option)
                                            showStatusDropdown = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Job URL
            app.jobUrl?.let { url ->
                ContinuumButton(
                    text = "View job posting",
                    onClick = {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    },
                    modifier = Modifier.fillMaxWidth(),
                    variant = ContinuumButtonVariant.Secondary
                )
            }

            // Notes
            ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Notes", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        modifier = Modifier.fillMaxWidth().height(120.dp),
                        placeholder = { Text("Add notes about this application...") },
                        shape = MaterialTheme.shapes.small,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrandPurple,
                            unfocusedBorderColor = Border
                        )
                    )
                    TextButton(
                        onClick = { viewModel.updateApplicationNotes(appId, notes) },
                        modifier = Modifier.align(Alignment.End)
                    ) {
                        Text("Save notes", color = BrandPurple)
                    }
                }
            }

            // Contacts
            if (app.contacts.isNotEmpty()) {
                ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Contacts", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                        app.contacts.forEach { contact ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(contact.name, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                                    Text(contact.role, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                                }
                                contact.linkedIn?.let { url ->
                                    TextButton(onClick = {
                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                    }) {
                                        Text("LinkedIn", color = BrandPurple)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
