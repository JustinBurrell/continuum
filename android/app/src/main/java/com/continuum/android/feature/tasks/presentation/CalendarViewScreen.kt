package com.continuum.android.feature.tasks.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.tasks.domain.Task
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun CalendarViewScreen(
    onNavigateBack: () -> Unit,
    viewModel: TasksViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    var currentCalendar by remember { mutableStateOf(Calendar.getInstance()) }
    var selectedDate by remember { mutableStateOf<String?>(null) }
    var selectedDayTasks by remember { mutableStateOf<List<Task>>(emptyList()) }

    LaunchedEffect(Unit) { viewModel.loadTasks() }

    val year = currentCalendar.get(Calendar.YEAR)
    val month = currentCalendar.get(Calendar.MONTH)
    val monthName = SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(currentCalendar.time)

    // Build set of days that have tasks
    val taskDays = state.tasks.mapNotNull { it.dueDateShort }.toSet()

    // Build calendar grid
    val firstDayOfMonth = Calendar.getInstance().apply { set(year, month, 1) }
    val daysInMonth = firstDayOfMonth.getActualMaximum(Calendar.DAY_OF_MONTH)
    val firstDayOfWeek = firstDayOfMonth.get(Calendar.DAY_OF_WEEK) - 1 // 0=Sunday

    Scaffold(
        topBar = {
            PurpleTopAppBar(
                title = "Calendar",
                onNavigateBack = onNavigateBack
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            // Month navigation
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = {
                    currentCalendar = Calendar.getInstance().apply {
                        time = currentCalendar.time
                        add(Calendar.MONTH, -1)
                    }
                    selectedDate = null
                }) {
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowLeft, "Previous month", tint = TextPrimary)
                }

                Text(
                    text = monthName,
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextPrimary
                )

                IconButton(onClick = {
                    currentCalendar = Calendar.getInstance().apply {
                        time = currentCalendar.time
                        add(Calendar.MONTH, 1)
                    }
                    selectedDate = null
                }) {
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, "Next month", tint = TextPrimary)
                }
            }

            Spacer(Modifier.height(8.dp))

            // Day of week headers
            Row(modifier = Modifier.fillMaxWidth()) {
                listOf("S", "M", "T", "W", "T", "F", "S").forEach { day ->
                    Text(
                        text = day,
                        style = MaterialTheme.typography.labelMedium,
                        color = TextMuted,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Spacer(Modifier.height(4.dp))

            // Calendar grid
            val cells = (0 until firstDayOfWeek) + (1..daysInMonth)
            cells.chunked(7).forEach { week ->
                Row(modifier = Modifier.fillMaxWidth()) {
                    repeat(7) { weekDay ->
                        val day = week.getOrNull(weekDay)
                        Box(
                            modifier = Modifier.weight(1f).aspectRatio(1f),
                            contentAlignment = Alignment.Center
                        ) {
                            if (day != null && day != 0) {
                                val dateStr = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day)
                                val hasTasks = taskDays.contains(dateStr)
                                val isSelected = selectedDate == dateStr

                                Box(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(CircleShape)
                                        .background(if (isSelected) BrandPurple else androidx.compose.ui.graphics.Color.Transparent)
                                        .clickable {
                                            selectedDate = dateStr
                                            selectedDayTasks = state.tasks.filter { it.dueDateShort == dateStr }
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(
                                            text = day.toString(),
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = if (isSelected) White else TextPrimary
                                        )
                                        if (hasTasks) {
                                            Box(
                                                modifier = Modifier
                                                    .size(4.dp)
                                                    .background(if (isSelected) White else BrandPurple, CircleShape)
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Selected day tasks
            selectedDate?.let { date ->
                Spacer(Modifier.height(16.dp))
                HorizontalDivider(color = Border)
                Spacer(Modifier.height(12.dp))
                Text(
                    "Tasks on $date",
                    style = MaterialTheme.typography.headlineSmall,
                    color = TextPrimary
                )
                Spacer(Modifier.height(8.dp))

                if (selectedDayTasks.isEmpty()) {
                    Text("No tasks on this day.", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(selectedDayTasks, key = { it.id }) { task ->
                            ContinuumCard(modifier = Modifier.fillMaxWidth()) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(task.title, style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                                        Text(task.status.replace("_", " ").replaceFirstChar { it.uppercase() },
                                            style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                                    }
                                    if (task.isOverdue) {
                                        Surface(color = ErrorRedBg, shape = RoundedCornerShape(4.dp)) {
                                            Text("Overdue", style = MaterialTheme.typography.labelSmall, color = ErrorRed,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
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
}
