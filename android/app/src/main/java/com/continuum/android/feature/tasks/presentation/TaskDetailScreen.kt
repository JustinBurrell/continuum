package com.continuum.android.feature.tasks.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.tasks.domain.Task

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailScreen(
    taskId: String,
    onNavigateBack: () -> Unit,
    viewModel: TasksViewModel = hiltViewModel()
) {
    val detailState by viewModel.taskDetailState.collectAsStateWithLifecycle()

    LaunchedEffect(taskId) { viewModel.loadTaskDetail(taskId) }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = "Task",
                onNavigateBack = onNavigateBack,
                actions = {
                    if (detailState.task != null) {
                        var showMenu by remember { mutableStateOf(false) }
                        IconButton(onClick = { showMenu = true }) {
                            Icon(Icons.Default.MoreVert, "More", tint = TextPrimary)
                        }
                        DropdownMenu(expanded = showMenu, onDismissRequest = { showMenu = false }) {
                            DropdownMenuItem(
                                text = { Text("Delete") },
                                onClick = {
                                    showMenu = false
                                    viewModel.deleteTask(taskId)
                                    onNavigateBack()
                                },
                                leadingIcon = { Icon(Icons.Default.Delete, null, tint = ErrorRed) }
                            )
                        }
                    }
                }
            )
        },
        containerColor = PageBackground
    ) { padding ->
        when {
            detailState.isLoading -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandPurple)
                }
            }
            detailState.error != null -> {
                Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                    Text(detailState.error ?: "Error loading task", color = ErrorRed)
                }
            }
            detailState.task != null -> {
                val task = detailState.task!!
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(Spacing.lg)
                ) {
                    TaskDetailContent(task = task, onStatusChange = { status ->
                        viewModel.updateTaskStatus(taskId, status)
                    })
                }
            }
        }
    }
}

@Composable
private fun TaskDetailContent(task: Task, onStatusChange: (String) -> Unit) {
    Text(
        text = task.title,
        style = MaterialTheme.typography.headlineMedium,
        fontWeight = FontWeight.Bold,
        color = TextPrimary
    )

    Spacer(Modifier.height(Spacing.sm))

    Row(
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm),
        verticalAlignment = Alignment.CenterVertically
    ) {
        StatusChip(task.status)
        task.priority?.let { PriorityChip(it) }
        task.type?.let { TypeChip(it) }
    }

    if (task.description.isNotBlank()) {
        Spacer(Modifier.height(Spacing.lg))
        ContinuumCard(modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.padding(Spacing.cardInner)) {
                Text("Description", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                Spacer(Modifier.height(Spacing.sm))
                Text(task.description, style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
            }
        }
    }

    Spacer(Modifier.height(Spacing.lg))

    ContinuumCard(modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(Spacing.cardInner), verticalArrangement = Arrangement.spacedBy(Spacing.md)) {
            Text("Details", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = TextPrimary)

            task.dueDate?.let {
                DetailRow(icon = Icons.Default.CalendarToday, label = "Due Date", value = it.take(10))
            }
            task.duration?.let {
                DetailRow(icon = Icons.Default.Timer, label = "Duration", value = "${it}min")
            }
            task.reminderMinutes?.let {
                DetailRow(icon = Icons.Default.Notifications, label = "Reminder", value = "${it}min before")
            }
            if (task.isShared) {
                DetailRow(icon = Icons.Default.People, label = "Shared", value = "${task.participants.size} participant(s)")
            }
            if (task.recurrenceFrequency != null && task.recurrenceFrequency != "none") {
                DetailRow(icon = Icons.Default.Repeat, label = "Recurrence", value = task.recurrenceFrequency.replaceFirstChar { it.uppercase() })
            }
        }
    }

    Spacer(Modifier.height(Spacing.lg))

    val statusOptions = listOf("todo", "in_progress", "completed")
    Text("Change Status", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = TextPrimary)
    Spacer(Modifier.height(Spacing.sm))
    Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
        statusOptions.forEach { status ->
            FilterChip(
                selected = task.status == status,
                onClick = { if (task.status != status) onStatusChange(status) },
                label = { Text(status.replace("_", " ").replaceFirstChar { it.uppercase() }) }
            )
        }
    }

    if (task.isOverdue) {
        Spacer(Modifier.height(Spacing.md))
        Surface(
            color = ErrorRed.copy(alpha = 0.1f),
            shape = AppShape.sm,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(Modifier.padding(Spacing.md), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Warning, null, tint = ErrorRed, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(Spacing.sm))
                Text("This task is overdue", style = MaterialTheme.typography.bodySmall, color = ErrorRed)
            }
        }
    }
}

@Composable
private fun DetailRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = TextMuted, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(Spacing.sm))
        Text(label, style = MaterialTheme.typography.bodySmall, color = TextMuted, modifier = Modifier.width(100.dp))
        Text(value, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
    }
}

@Composable
private fun StatusChip(status: String) {
    val color = when (status) {
        "todo" -> TextMuted
        "in_progress" -> WarningAmber
        "completed" -> SuccessGreen
        else -> TextMuted
    }
    Surface(color = color.copy(alpha = 0.12f), shape = AppShape.chip) {
        Text(
            text = status.replace("_", " ").replaceFirstChar { it.uppercase() },
            style = MaterialTheme.typography.labelSmall,
            color = color,
            modifier = Modifier.padding(horizontal = Spacing.sm, vertical = Spacing.xs)
        )
    }
}

@Composable
private fun PriorityChip(priority: String) {
    val color = when (priority) {
        "high" -> ErrorRed
        "medium" -> WarningAmber
        else -> SuccessGreen
    }
    Surface(color = color.copy(alpha = 0.12f), shape = AppShape.chip) {
        Text(
            text = priority.replaceFirstChar { it.uppercase() },
            style = MaterialTheme.typography.labelSmall,
            color = color,
            modifier = Modifier.padding(horizontal = Spacing.sm, vertical = Spacing.xs)
        )
    }
}

@Composable
private fun TypeChip(type: String) {
    Surface(color = BrandPurple.copy(alpha = 0.12f), shape = AppShape.chip) {
        Text(
            text = type.replaceFirstChar { it.uppercase() },
            style = MaterialTheme.typography.labelSmall,
            color = BrandPurple,
            modifier = Modifier.padding(horizontal = Spacing.sm, vertical = Spacing.xs)
        )
    }
}
