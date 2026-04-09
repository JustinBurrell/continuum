package com.continuum.android.feature.tasks.presentation

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import androidx.compose.material3.ExperimentalMaterial3Api

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskCreationBottomSheet(
    onDismiss: () -> Unit,
    onCreate: (title: String, priority: String?, dueDate: String?, type: String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var selectedPriority by remember { mutableStateOf<String?>(null) }
    var selectedType by remember { mutableStateOf<String?>(null) }
    var dueDate by remember { mutableStateOf("") }

    val priorities = listOf("low", "medium", "high")
    val types = listOf("Homework", "Study", "Project", "Exam Prep")

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .padding(horizontal = 24.dp, vertical = 16.dp)
                .imePadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Create task", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)

            ContinuumTextField(
                value = title,
                onValueChange = { title = it },
                label = "Task title *",
                placeholder = "What needs to be done?"
            )

            ContinuumTextField(
                value = dueDate,
                onValueChange = { dueDate = it },
                label = "Due date (YYYY-MM-DD) *",
                placeholder = "2025-12-31"
            )

            // Priority
            Text("Priority", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                priorities.forEach { p ->
                    FilterChip(
                        selected = selectedPriority == p,
                        onClick = { selectedPriority = if (selectedPriority == p) null else p },
                        label = { Text(p.replaceFirstChar { it.uppercase() }) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandPurple,
                            selectedLabelColor = White
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }

            // Type
            Text("Type", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                types.take(2).forEach { t ->
                    FilterChip(
                        selected = selectedType == t,
                        onClick = { selectedType = if (selectedType == t) null else t },
                        label = { Text(t) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandPurple,
                            selectedLabelColor = White
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                types.drop(2).forEach { t ->
                    FilterChip(
                        selected = selectedType == t,
                        onClick = { selectedType = if (selectedType == t) null else t },
                        label = { Text(t) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandPurple,
                            selectedLabelColor = White
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }

            ContinuumButton(
                text = "Create task",
                onClick = {
                    if (title.isNotBlank() && dueDate.isNotBlank()) {
                        onCreate(title, selectedPriority, dueDate, selectedType)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = title.isNotBlank() && dueDate.isNotBlank()
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}
