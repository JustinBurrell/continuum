@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.continuum.android.feature.career.presentation

import androidx.compose.foundation.ExperimentalFoundationApi
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
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.career.domain.Application
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import androidx.compose.material3.ExperimentalMaterial3Api

private val statusTabs = listOf("all", "draft", "applied", "interview", "offer", "rejected", "withdrawn")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ApplicationsListScreen(
    onApplicationClick: (String) -> Unit,
    onResumesClick: (() -> Unit)? = null,
    onLogoClick: (() -> Unit)? = null,
    viewModel: CareerViewModel = hiltViewModel()
) {
    val state by viewModel.applicationsState.collectAsStateWithLifecycle()
    val filtered by viewModel.filteredApplications.collectAsStateWithLifecycle()
    var showCreateSheet by remember { mutableStateOf(false) }
    var appToDelete by remember { mutableStateOf<Application?>(null) }
    val selectedTabIndex = statusTabs.indexOf(state.statusFilter).coerceAtLeast(0)

    LaunchedEffect(Unit) { viewModel.loadApplications() }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            InlineScreenHeader(
                title = "Applications",
                trailing = {
                    if (onResumesClick != null) {
                        IconButton(onClick = onResumesClick) {
                            Icon(Icons.Default.Description, contentDescription = "Resumes", tint = BrandPurple)
                        }
                    }
                }
            )

            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = viewModel::setApplicationsSearchQuery,
                placeholder = { Text("Search company or role...") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                leadingIcon = { Icon(Icons.Default.Search, null, tint = TextSecondary) },
                trailingIcon = {
                    if (state.searchQuery.isNotBlank()) {
                        IconButton(onClick = { viewModel.setApplicationsSearchQuery("") }) {
                            Icon(Icons.Default.Close, null, tint = TextSecondary)
                        }
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BrandPurple,
                    unfocusedBorderColor = Border
                )
            )

            ScrollableTabRow(
                selectedTabIndex = selectedTabIndex,
                containerColor = White,
                contentColor = BrandPurple,
                edgePadding = 8.dp,
                divider = { HorizontalDivider(color = Border) }
            ) {
                statusTabs.forEachIndexed { index, status ->
                    Tab(
                        selected = selectedTabIndex == index,
                        onClick = { viewModel.setStatusFilter(status) }
                    ) {
                        Text(
                            status.replaceFirstChar { it.uppercase() },
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 12.dp)
                        )
                    }
                }
            }

            SwipeRefresh(
                state = rememberSwipeRefreshState(state.isLoading),
                onRefresh = { viewModel.loadApplications() },
                modifier = Modifier.weight(1f)
            ) {
                when {
                    state.isLoading && state.applications.isEmpty() -> {
                        LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(4) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(80.dp)) }
                        }
                    }

                    filtered.isEmpty() -> {
                        EmptyState(
                            icon = Icons.Default.Work,
                            headline = "No applications",
                            subtext = if (state.statusFilter == "all") "Track your job applications here" else "No ${state.statusFilter} applications",
                            actionLabel = if (state.statusFilter == "all") "Add application" else null,
                            onAction = if (state.statusFilter == "all") ({ showCreateSheet = true }) else null,
                            modifier = Modifier.fillMaxSize()
                        )
                    }

                    else -> {
                        LazyColumn(
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(filtered, key = { it.id }) { app ->
                                ApplicationCard(
                                    app = app,
                                    onClick = { onApplicationClick(app.id) },
                                    onDelete = { appToDelete = app }
                                )
                            }
                        }
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { showCreateSheet = true },
            containerColor = BrandPurple,
            contentColor = White,
            modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp)
        ) {
            Icon(Icons.Default.Add, "Add application")
        }
    }

    appToDelete?.let { app ->
        AlertDialog(
            onDismissRequest = { appToDelete = null },
            title = { Text("Delete application?") },
            text = { Text("\"${app.company} - ${app.position}\" will be deleted.") },
            confirmButton = {
                TextButton(onClick = { viewModel.deleteApplication(app.id); appToDelete = null }) {
                    Text("Delete", color = ErrorRed)
                }
            },
            dismissButton = { TextButton(onClick = { appToDelete = null }) { Text("Cancel") } }
        )
    }

    if (showCreateSheet) {
        CreateApplicationSheet(
            onDismiss = { showCreateSheet = false },
            onCreate = { company, position ->
                viewModel.createApplication(company, position) { showCreateSheet = false }
            }
        )
    }
}

@Composable
private fun ApplicationCard(app: Application, onClick: () -> Unit, onDelete: () -> Unit) {
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
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(app.company, style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                    Text(app.position, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    app.appliedDate?.let {
                        Text("Applied: ${it.take(10)}", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                    }
                }
                StatusBadge(app.status)
            }
        }
    }
}

@Composable
private fun CreateApplicationSheet(onDismiss: () -> Unit, onCreate: (company: String, position: String) -> Unit) {
    var company by remember { mutableStateOf("") }
    var position by remember { mutableStateOf("") }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp).imePadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Add application", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
            ContinuumTextField(value = company, onValueChange = { company = it }, label = "Company", placeholder = "Acme Corp")
            ContinuumTextField(value = position, onValueChange = { position = it }, label = "Position", placeholder = "Software Engineer")
            ContinuumButton(
                text = "Save",
                onClick = { if (company.isNotBlank() && position.isNotBlank()) onCreate(company, position) },
                modifier = Modifier.fillMaxWidth(),
                enabled = company.isNotBlank() && position.isNotBlank()
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}
