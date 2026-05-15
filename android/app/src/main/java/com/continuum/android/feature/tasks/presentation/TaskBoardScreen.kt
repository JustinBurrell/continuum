package com.continuum.android.feature.tasks.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.tasks.domain.Task
import androidx.compose.material3.ExperimentalMaterial3Api
import com.continuum.android.core.ui.components.ContinuumPullToRefresh

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskBoardScreen(
    onCalendar: () -> Unit,
    networkMonitor: NetworkMonitor,
    onLogoClick: (() -> Unit)? = null,
    onTaskClick: (String) -> Unit = {},
    viewModel: TasksViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)
    val isDemo = LocalIsDemo.current

    var showCreateSheet by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { viewModel.loadTasks() }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            if (!isOnline) OfflineBanner()
            InlineScreenHeader(title = "Tasks")

            OutlinedTextField(
                value = state.searchQuery,
                onValueChange = viewModel::setSearchQuery,
                placeholder = { Text("Search tasks...") },
                singleLine = true,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                leadingIcon = { Icon(Icons.Default.Search, null, tint = TextSecondary) },
                trailingIcon = {
                    if (state.searchQuery.isNotBlank()) {
                        IconButton(onClick = { viewModel.setSearchQuery("") }) {
                            Icon(Icons.Default.Close, null, tint = TextSecondary)
                        }
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = BrandPurple,
                    unfocusedBorderColor = Border
                )
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = !state.isSharedTab,
                    onClick = { viewModel.setSharedTab(false) },
                    label = { Text("My tasks") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrandPurple,
                        selectedLabelColor = White
                    )
                )
                FilterChip(
                    selected = state.isSharedTab,
                    onClick = { viewModel.setSharedTab(true) },
                    label = { Text("Shared with me") },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = BrandPurple,
                        selectedLabelColor = White
                    )
                )
            }

            val statuses = listOf(
                "todo" to "To Do",
                "in_progress" to "In Progress",
                "completed" to "Completed"
            )
            TabRow(
                selectedTabIndex = statuses.indexOfFirst { it.first == state.selectedStatus }.coerceAtLeast(0),
                containerColor = PageBackground,
                contentColor = BrandPurple
            ) {
                statuses.forEach { (statusValue, label) ->
                    Tab(
                        selected = state.selectedStatus == statusValue,
                        onClick = { viewModel.setStatus(statusValue) },
                        text = { Text(label) }
                    )
                }
            }

            ContinuumPullToRefresh(
                isLoading = state.isLoading,
                onRefresh = { viewModel.loadTasks() },
                modifier = Modifier.weight(1f)
            ) {
                val filteredTasks = state.tasks
                    .filter { it.status == state.selectedStatus }
                    .sortedWith(
                        compareBy<Task> {
                            when (it.priority?.lowercase()) {
                                "high" -> 0
                                "medium" -> 1
                                else -> 2
                            }
                        }.thenBy { it.dueDate ?: "9999-12-31" }
                    )

                if (filteredTasks.isEmpty()) {
                    EmptyState(
                        icon = Icons.Default.CheckCircle,
                        headline = if (state.searchQuery.isNotBlank()) "No matching tasks" else "No tasks in this status",
                        subtext = if (state.searchQuery.isNotBlank()) "Try another search term" else "Use + to add a new task",
                        clearSearchAction = if (state.searchQuery.isNotBlank()) { { viewModel.setSearchQuery("") } } else null,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(filteredTasks, key = { it.id }) { task ->
                            TaskCard(
                                task = task,
                                moveLabel = when (state.selectedStatus) {
                                    "todo" -> "Start"
                                    "in_progress" -> "Complete"
                                    else -> "Reopen"
                                },
                                onMove = if (isDemo) null else {
                                    {
                                        val target = when (state.selectedStatus) {
                                            "todo" -> "in_progress"
                                            "in_progress" -> "completed"
                                            else -> "todo"
                                        }
                                        viewModel.moveTask(task.id, target)
                                    }
                                },
                                onDelete = if (isDemo || task.isShared) null else { { viewModel.deleteTask(task.id) } },
                                onClick = { onTaskClick(task.id) }
                            )
                        }
                    }
                }
            }
        }

        if (!isDemo) {
            FloatingActionButton(
                onClick = { showCreateSheet = true },
                containerColor = BrandPurple,
                contentColor = White,
                modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp)
            ) {
                Icon(Icons.Default.Add, "Create task")
            }
        }
    }

    if (showCreateSheet && !isDemo) {
        TaskCreationBottomSheet(
            onDismiss = { showCreateSheet = false },
            onCreate = { title, priority, dueDate, type ->
                viewModel.createTask(title = title, priority = priority, dueDate = dueDate, type = type) {
                    showCreateSheet = false
                }
            }
        )
    }
}

@Composable
private fun TaskCard(
    task: Task,
    moveLabel: String,
    onMove: (() -> Unit)?,
    onDelete: (() -> Unit)?,
    onClick: () -> Unit = {}
) {
    ContinuumCard(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(task.title, style = MaterialTheme.typography.headlineSmall, color = TextPrimary)

            if (task.description.isNotBlank()) {
                Text(
                    task.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            task.type?.takeIf { it.isNotBlank() }?.let { type ->
                Surface(color = BrandPurple.copy(alpha = 0.12f), shape = AppShape.chip) {
                    Text(
                        type.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelSmall,
                        color = BrandPurple,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            if (task.dueDate != null) {
                Text(
                    text = "Due: ${task.dueDateShort}",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (task.isOverdue) ErrorRed else TextSecondary
                )
            }

            task.priority?.let { priority ->
                Surface(
                    color = when (priority) {
                        "high" -> ErrorRedBg
                        "medium" -> WarningAmberBg
                        else -> SuccessGreenBg
                    },
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        priority.replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.labelSmall,
                        color = when (priority) {
                            "high" -> ErrorRed
                            "medium" -> WarningAmber
                            else -> SuccessGreen
                        },
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                onMove?.let { move ->
                    TextButton(onClick = move, contentPadding = PaddingValues(0.dp)) {
                        Text(moveLabel, color = BrandPurple, style = MaterialTheme.typography.labelMedium)
                    }
                }
                onDelete?.let {
                    TextButton(onClick = it, contentPadding = PaddingValues(0.dp)) {
                        Text("Delete", color = ErrorRed, style = MaterialTheme.typography.labelMedium)
                    }
                }
                if (task.isShared) {
                    Surface(color = PurpleTint, shape = RoundedCornerShape(4.dp)) {
                        Text(
                            text = "Shared",
                            style = MaterialTheme.typography.labelSmall,
                            color = BrandPurple,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }
    }
}
