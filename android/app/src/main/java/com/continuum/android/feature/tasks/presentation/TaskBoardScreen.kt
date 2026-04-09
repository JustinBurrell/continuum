package com.continuum.android.feature.tasks.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.network.NetworkMonitor
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.tasks.domain.Task
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState

@Composable
fun TaskBoardScreen(
    onCalendar: () -> Unit,
    networkMonitor: NetworkMonitor,
    onLogoClick: (() -> Unit)? = null,
    viewModel: TasksViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val todoTasks by viewModel.todoTasks.collectAsStateWithLifecycle()
    val inProgressTasks by viewModel.inProgressTasks.collectAsStateWithLifecycle()
    val doneTasks by viewModel.doneTasks.collectAsStateWithLifecycle()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle(initialValue = true)

    var showCreateSheet by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { viewModel.loadTasks() }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            if (!isOnline) OfflineBanner()
            PurpleTopAppBar(
                title = "Tasks",
                onLogoClick = onLogoClick,
                actions = {
                    IconButton(onClick = onCalendar) {
                        Icon(Icons.Default.CalendarMonth, "Calendar", tint = androidx.compose.ui.graphics.Color.White)
                    }
                }
            )

            SwipeRefresh(
                state = rememberSwipeRefreshState(state.isLoading),
                onRefresh = { viewModel.loadTasks() },
                modifier = Modifier.weight(1f)
            ) {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    item {
                        KanbanColumn(
                            title = "TO DO",
                            tasks = todoTasks,
                            headerColor = BrandPurple,
                            headerBgColor = PurpleTint,
                            targetStatus = "in_progress",
                            onMoveTask = { id -> viewModel.moveTask(id, "in_progress") },
                            onDeleteTask = { id -> viewModel.deleteTask(id) }
                        )
                    }
                    item {
                        KanbanColumn(
                            title = "IN PROGRESS",
                            tasks = inProgressTasks,
                            headerColor = WarningAmber,
                            headerBgColor = WarningAmberBg,
                            targetStatus = "done",
                            onMoveTask = { id -> viewModel.moveTask(id, "done") },
                            onDeleteTask = { id -> viewModel.deleteTask(id) }
                        )
                    }
                    item {
                        KanbanColumn(
                            title = "DONE",
                            tasks = doneTasks,
                            headerColor = SuccessGreen,
                            headerBgColor = SuccessGreenBg,
                            targetStatus = "todo",
                            onMoveTask = { id -> viewModel.moveTask(id, "todo") },
                            onDeleteTask = { id -> viewModel.deleteTask(id) }
                        )
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
            Icon(Icons.Default.Add, "Create task")
        }
    }

    if (showCreateSheet) {
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
private fun KanbanColumn(
    title: String,
    tasks: List<Task>,
    headerColor: androidx.compose.ui.graphics.Color,
    headerBgColor: androidx.compose.ui.graphics.Color,
    targetStatus: String,
    onMoveTask: (String) -> Unit,
    onDeleteTask: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .width(280.dp)
            .fillMaxHeight()
    ) {
        Surface(
            color = headerBgColor,
            shape = RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge,
                color = headerColor,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp)
            )
        }

        LazyColumn(
            contentPadding = PaddingValues(vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f, fill = false)
                .background(PageBackground, RoundedCornerShape(bottomStart = 8.dp, bottomEnd = 8.dp))
                .padding(8.dp)
        ) {
            if (tasks.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No tasks", style = MaterialTheme.typography.bodySmall, color = TextMuted)
                    }
                }
            } else {
                items(tasks, key = { it.id }) { task ->
                    TaskCard(
                        task = task,
                        moveLabel = when (targetStatus) {
                            "in_progress" -> "Start"
                            "done" -> "Done"
                            else -> "Reset"
                        },
                        onMove = { onMoveTask(task.id) },
                        onDelete = { onDeleteTask(task.id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun TaskCard(
    task: Task,
    moveLabel: String,
    onMove: () -> Unit,
    onDelete: () -> Unit
) {
    ContinuumCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(task.title, style = MaterialTheme.typography.headlineSmall, color = TextPrimary)

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

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextButton(onClick = onMove, contentPadding = PaddingValues(0.dp)) {
                    Text(moveLabel, color = BrandPurple, style = MaterialTheme.typography.labelMedium)
                }
                TextButton(onClick = onDelete, contentPadding = PaddingValues(0.dp)) {
                    Text("Delete", color = ErrorRed, style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}
