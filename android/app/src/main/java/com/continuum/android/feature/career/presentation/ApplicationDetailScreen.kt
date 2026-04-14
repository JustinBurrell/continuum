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
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

private val statusOptions = listOf("draft", "applied", "interview", "offer", "rejected", "withdrawn")

@OptIn(ExperimentalMaterial3Api::class)
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
    val isDemo = LocalIsDemo.current

    var notes by remember(app?.notes) { mutableStateOf(app?.notes ?: "") }
    var showStatusDropdown by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showAddContactSheet by remember { mutableStateOf(false) }
    var showAddReminderSheet by remember { mutableStateOf(false) }

    // Add contact form state
    var contactName by remember { mutableStateOf("") }
    var contactRole by remember { mutableStateOf("") }
    var contactLinkedIn by remember { mutableStateOf("") }
    var contactEmail by remember { mutableStateOf("") }

    // Add reminder form state
    var reminderDate by remember { mutableStateOf("") }
    var reminderDescription by remember { mutableStateOf("") }

    LaunchedEffect(Unit) { if (state.applications.isEmpty()) viewModel.loadApplications() }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete Application") },
            text = { Text("Are you sure you want to delete this application? This cannot be undone.") },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.deleteApplication(appId)
                    showDeleteConfirm = false
                    onNavigateBack()
                }) { Text("Delete", color = ErrorRed) }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text("Cancel") }
            }
        )
    }

    if (showAddContactSheet) {
        ModalBottomSheet(onDismissRequest = {
            showAddContactSheet = false
            contactName = ""; contactRole = ""; contactLinkedIn = ""; contactEmail = ""
        }) {
            Column(
                modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Add Contact", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                OutlinedTextField(
                    value = contactName,
                    onValueChange = { contactName = it },
                    label = { Text("Name *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                OutlinedTextField(
                    value = contactRole,
                    onValueChange = { contactRole = it },
                    label = { Text("Role") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                OutlinedTextField(
                    value = contactLinkedIn,
                    onValueChange = { contactLinkedIn = it },
                    label = { Text("LinkedIn URL") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                OutlinedTextField(
                    value = contactEmail,
                    onValueChange = { contactEmail = it },
                    label = { Text("Email") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                ContinuumButton(
                    text = "Add Contact",
                    onClick = {
                        if (contactName.isNotBlank()) {
                            viewModel.addContact(appId, contactName, contactRole, contactLinkedIn, contactEmail)
                            showAddContactSheet = false
                            contactName = ""; contactRole = ""; contactLinkedIn = ""; contactEmail = ""
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = contactName.isNotBlank()
                )
            }
        }
    }

    if (showAddReminderSheet) {
        ModalBottomSheet(onDismissRequest = {
            showAddReminderSheet = false
            reminderDate = ""; reminderDescription = ""
        }) {
            Column(
                modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Add Reminder", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                OutlinedTextField(
                    value = reminderDate,
                    onValueChange = { reminderDate = it },
                    label = { Text("Date (YYYY-MM-DD) *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                OutlinedTextField(
                    value = reminderDescription,
                    onValueChange = { reminderDescription = it },
                    label = { Text("Description *") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                ContinuumButton(
                    text = "Add Reminder",
                    onClick = {
                        if (reminderDate.isNotBlank() && reminderDescription.isNotBlank()) {
                            viewModel.addReminder(appId, reminderDate, reminderDescription)
                            showAddReminderSheet = false
                            reminderDate = ""; reminderDescription = ""
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = reminderDate.isNotBlank() && reminderDescription.isNotBlank()
                )
            }
        }
    }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = app?.company ?: "Application",
                onNavigateBack = onNavigateBack,
                actions = {
                    if (!isDemo) {
                        IconButton(onClick = { showDeleteConfirm = true }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete application", tint = ErrorRed)
                        }
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
                        StatusBadge(app.status)
                        if (!isDemo) {
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
                        onValueChange = { if (!isDemo) notes = it },
                        modifier = Modifier.fillMaxWidth().height(120.dp),
                        placeholder = { Text("Add notes about this application...") },
                        shape = MaterialTheme.shapes.small,
                        readOnly = isDemo,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrandPurple,
                            unfocusedBorderColor = Border
                        )
                    )
                    if (!isDemo) {
                        TextButton(
                            onClick = { viewModel.updateApplicationNotes(appId, notes) },
                            modifier = Modifier.align(Alignment.End)
                        ) {
                            Text("Save notes", color = BrandPurple)
                        }
                    }
                }
            }

            // Contacts
            ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Contacts", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                        if (!isDemo) {
                            IconButton(onClick = { showAddContactSheet = true }, modifier = Modifier.size(32.dp)) {
                                Icon(Icons.Default.Add, contentDescription = "Add contact", tint = BrandPurple)
                            }
                        }
                    }
                    if (app.contacts.isEmpty()) {
                        Text("No contacts yet", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                    } else {
                        app.contacts.forEach { contact ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(contact.name, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                                    if (contact.role.isNotBlank()) {
                                        Text(contact.role, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                                    }
                                    contact.email?.takeIf { it.isNotBlank() }?.let {
                                        Text(it, style = MaterialTheme.typography.bodySmall, color = TextMuted)
                                    }
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    contact.linkedIn?.takeIf { it.isNotBlank() }?.let { url ->
                                        TextButton(onClick = {
                                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                                        }) {
                                            Text("LinkedIn", color = BrandPurple)
                                        }
                                    }
                                    if (!isDemo && contact.id.isNotBlank()) {
                                        IconButton(onClick = { viewModel.deleteContact(appId, contact.id) }, modifier = Modifier.size(32.dp)) {
                                            Icon(Icons.Default.Close, contentDescription = "Remove contact", tint = TextMuted)
                                        }
                                    }
                                }
                            }
                            if (contact != app.contacts.last()) HorizontalDivider(color = Border, thickness = 0.5.dp)
                        }
                    }
                }
            }

            // Reminders
            ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Reminders", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                        if (!isDemo) {
                            IconButton(onClick = { showAddReminderSheet = true }, modifier = Modifier.size(32.dp)) {
                                Icon(Icons.Default.Add, contentDescription = "Add reminder", tint = BrandPurple)
                            }
                        }
                    }
                    if (app.reminders.isEmpty()) {
                        Text("No reminders yet", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                    } else {
                        app.reminders.forEach { reminder ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(reminder.description, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                                    reminder.date?.takeIf { it.isNotBlank() }?.let {
                                        Text(it.take(10), style = MaterialTheme.typography.bodySmall, color = TextMuted)
                                    }
                                    if (reminder.completed) {
                                        Text("Completed", style = MaterialTheme.typography.bodySmall, color = SuccessGreen)
                                    }
                                }
                                if (!isDemo) {
                                    IconButton(onClick = { viewModel.deleteReminder(appId, reminder.id) }, modifier = Modifier.size(32.dp)) {
                                        Icon(Icons.Default.Close, contentDescription = "Remove reminder", tint = TextMuted)
                                    }
                                }
                            }
                            if (reminder != app.reminders.last()) HorizontalDivider(color = Border, thickness = 0.5.dp)
                        }
                    }
                }
            }
        }
    }
}
