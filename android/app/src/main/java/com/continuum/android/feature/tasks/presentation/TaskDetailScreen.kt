package com.continuum.android.feature.tasks.presentation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.LocalTokenManager
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.feature.social.domain.Friend
import com.continuum.android.feature.social.presentation.SocialViewModel
import com.continuum.android.feature.tasks.domain.Task
import com.continuum.android.feature.tasks.domain.TaskParticipant

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailScreen(
    taskId: String,
    onNavigateBack: () -> Unit,
    onUserProfileClick: (String) -> Unit = {},
    viewModel: TasksViewModel = hiltViewModel()
) {
    val socialVm: SocialViewModel = hiltViewModel()
    val friendsState by socialVm.friendsState.collectAsStateWithLifecycle()
    val threadComments by socialVm.threadCommentsState.collectAsStateWithLifecycle()
    val detailState by viewModel.taskDetailState.collectAsStateWithLifecycle()
    val tokenManager = LocalTokenManager.current
    val isDemo = LocalIsDemo.current

    var showEditSheet by remember { mutableStateOf(false) }
    var showShareSheet by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showMenu by remember { mutableStateOf(false) }

    LaunchedEffect(taskId) { viewModel.loadTaskDetail(taskId) }

    DisposableEffect(taskId) {
        socialVm.loadThreadComments("task", taskId)
        onDispose { socialVm.clearThreadComments() }
    }

    LaunchedEffect(showShareSheet) {
        if (showShareSheet) socialVm.loadFriends()
    }

    Scaffold(
        topBar = {
            MinimalTopBar(
                title = "Task",
                onNavigateBack = onNavigateBack,
                actions = {
                    val task = detailState.task
                    val myId = tokenManager.getJwtUserId()
                    val isOwner = task != null && myId != null && task.userId == myId
                    if (task != null && isOwner && !isDemo) {
                        IconButton(onClick = { showEditSheet = true }) {
                            Icon(Icons.Default.Edit, "Edit", tint = TextPrimary)
                        }
                    }
                    if (task != null && isOwner && !isDemo) {
                        IconButton(onClick = { showMenu = true }) {
                            Icon(Icons.Default.MoreVert, "More", tint = TextPrimary)
                        }
                        DropdownMenu(expanded = showMenu, onDismissRequest = { showMenu = false }) {
                            if (isOwner) {
                                DropdownMenuItem(
                                    text = { Text("Delete") },
                                    onClick = {
                                        showMenu = false
                                        showDeleteConfirm = true
                                    },
                                    leadingIcon = { Icon(Icons.Default.Delete, null, tint = ErrorRed) }
                                )
                            }
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
                val myId = tokenManager.getJwtUserId()
                val isOwner = myId != null && task.userId == myId
                val myParticipant = myId?.let { id -> task.participants.find { it.userId == id } }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .verticalScroll(rememberScrollState())
                        .padding(Spacing.lg)
                ) {
                    TaskDetailContent(
                        task = task,
                        isOwner = isOwner,
                        myParticipant = myParticipant,
                        isDemo = isDemo,
                        onStatusChange = { status -> viewModel.updateTaskStatus(taskId, status) },
                        onUserProfileClick = onUserProfileClick
                    )

                    if (isOwner && !isDemo) {
                        Spacer(Modifier.height(Spacing.md))
                        OutlinedButton(
                            onClick = { showShareSheet = true },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(Icons.Default.People, null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(Spacing.sm))
                            Text(
                                if (task.participants.isNotEmpty()) {
                                    "${task.participants.size} collaborator${if (task.participants.size == 1) "" else "s"} — tap to manage"
                                } else {
                                    "Add collaborators"
                                }
                            )
                        }
                    }

                    Spacer(Modifier.height(Spacing.lg))
                    CommentThread(
                        comments = threadComments.comments,
                        onAddComment = { content, parentId ->
                            socialVm.addThreadComment(content, parentId)
                        },
                        onLikeComment = { commentId -> socialVm.likeThreadComment(commentId) },
                        onDeleteComment = null,
                        onUserClick = { uid -> onUserProfileClick(uid) },
                        isSending = threadComments.isSending,
                        readOnly = isDemo,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                if (showEditSheet) {
                    TaskEditBottomSheet(
                        task = task,
                        onDismiss = { showEditSheet = false },
                        onSave = { title, description, priority, type, dueDate ->
                            viewModel.saveTaskEdits(taskId, title, description, priority, type, dueDate) {
                                showEditSheet = false
                            }
                        }
                    )
                }

                if (showShareSheet) {
                    TaskShareBottomSheet(
                        friends = friendsState.friends,
                        isLoadingFriends = friendsState.isLoading,
                        initialParticipantIds = task.participants.map { it.userId }.toSet(),
                        onDismiss = { showShareSheet = false },
                        onSave = { ids ->
                            viewModel.saveTaskParticipants(taskId, ids) { showShareSheet = false }
                        }
                    )
                }

                if (showDeleteConfirm) {
                    AlertDialog(
                        onDismissRequest = { showDeleteConfirm = false },
                        title = { Text("Delete task?") },
                        text = { Text("This will remove it for all participants and cannot be undone.") },
                        confirmButton = {
                            TextButton(
                                onClick = {
                                    showDeleteConfirm = false
                                    viewModel.deleteTask(taskId)
                                    onNavigateBack()
                                }
                            ) { Text("Delete", color = ErrorRed) }
                        },
                        dismissButton = {
                            TextButton(onClick = { showDeleteConfirm = false }) { Text("Cancel") }
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun TaskDetailContent(
    task: Task,
    isOwner: Boolean,
    myParticipant: TaskParticipant?,
    isDemo: Boolean,
    onStatusChange: (String) -> Unit,
    onUserProfileClick: (String) -> Unit
) {
    var participantsExpanded by remember { mutableStateOf(false) }

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
    when {
        isOwner -> {
            Text("Status", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = TextPrimary)
            Spacer(Modifier.height(Spacing.sm))
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                statusOptions.forEach { status ->
                    FilterChip(
                        selected = task.status == status,
                        onClick = { if (!isDemo && task.status != status) onStatusChange(status) },
                        enabled = !isDemo,
                        label = { Text(status.replace("_", " ").replaceFirstChar { it.uppercase() }) }
                    )
                }
            }
        }
        myParticipant != null -> {
            Text("My progress", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = TextPrimary)
            Spacer(Modifier.height(Spacing.sm))
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                statusOptions.forEach { status ->
                    FilterChip(
                        selected = myParticipant.status == status,
                        onClick = { if (!isDemo && myParticipant.status != status) onStatusChange(status) },
                        enabled = !isDemo,
                        label = { Text(status.replace("_", " ").replaceFirstChar { it.uppercase() }) }
                    )
                }
            }
        }
        else -> {
            Text("Status", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = TextPrimary)
            Spacer(Modifier.height(Spacing.sm))
            Row(horizontalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                statusOptions.forEach { status ->
                    FilterChip(
                        selected = task.status == status,
                        onClick = { },
                        enabled = false,
                        label = { Text(status.replace("_", " ").replaceFirstChar { it.uppercase() }) }
                    )
                }
            }
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

    if (task.isShared && task.participants.isNotEmpty()) {
        Spacer(Modifier.height(Spacing.lg))
        Text("Collaborators", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = TextPrimary)
        Spacer(Modifier.height(Spacing.sm))
        Surface(
            modifier = Modifier.clickable { participantsExpanded = !participantsExpanded },
            shape = AppShape.sm,
            color = PurpleTint.copy(alpha = 0.35f)
        ) {
            Row(
                Modifier.padding(Spacing.md),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
            ) {
                Icon(Icons.Default.People, null, tint = BrandPurple, modifier = Modifier.size(18.dp))
                Text(
                    "${task.participants.size} collaborator${if (task.participants.size == 1) "" else "s"}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = BrandPurple,
                    fontWeight = FontWeight.Medium
                )
                Icon(
                    if (participantsExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    null,
                    tint = BrandPurple
                )
            }
        }
        if (participantsExpanded) {
            Spacer(Modifier.height(Spacing.sm))
            Column(verticalArrangement = Arrangement.spacedBy(Spacing.sm)) {
                task.participants.forEach { p ->
                    ParticipantRow(participant = p, onClick = { onUserProfileClick(p.userId) })
                }
            }
        }
    }
}

@Composable
private fun ParticipantRow(participant: TaskParticipant, onClick: () -> Unit) {
    ContinuumCard(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Row(
            Modifier.padding(Spacing.md),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
        ) {
            AvatarInitials(
                name = participant.displayName,
                modifier = Modifier.size(36.dp).clip(CircleShape)
            )
            Text(
                participant.displayName,
                style = MaterialTheme.typography.bodyMedium,
                color = TextPrimary,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.weight(1f)
            )
            StatusChipSmall(participant.status)
        }
    }
}

@Composable
private fun StatusChipSmall(status: String) {
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

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun TaskEditBottomSheet(
    task: Task,
    onDismiss: () -> Unit,
    onSave: (title: String, description: String, priority: String?, type: String?, dueDate: String?) -> Unit
) {
    var title by remember { mutableStateOf(task.title) }
    var description by remember { mutableStateOf(task.description) }
    var dueDate by remember { mutableStateOf(task.dueDate?.take(10).orEmpty()) }
    var selectedPriority by remember { mutableStateOf(task.priority) }
    var selectedType by remember { mutableStateOf(task.type) }

    LaunchedEffect(task.id, task.updatedAt) {
        title = task.title
        description = task.description
        dueDate = task.dueDate?.take(10).orEmpty()
        selectedPriority = task.priority
        selectedType = task.type
    }

    val priorities = listOf("low", "medium", "high")
    val types = listOf("homework", "study", "project", "exam", "club", "professional", "personal", "other")

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .padding(horizontal = 24.dp, vertical = 16.dp)
                .imePadding()
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Edit task", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)

            ContinuumTextField(
                value = title,
                onValueChange = { title = it },
                label = "Title *",
                singleLine = true
            )
            ContinuumTextField(
                value = description,
                onValueChange = { description = it },
                label = "Description",
                singleLine = false,
                maxLines = 4
            )
            ContinuumTextField(
                value = dueDate,
                onValueChange = { dueDate = it },
                label = "Due date (YYYY-MM-DD)",
                placeholder = "2025-12-31"
            )

            Text("Priority", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                priorities.forEach { p ->
                    FilterChip(
                        selected = selectedPriority == p,
                        onClick = { selectedPriority = if (selectedPriority == p) null else p },
                        label = { Text(p.replaceFirstChar { it.uppercase() }) }
                    )
                }
            }

            Text("Type", style = MaterialTheme.typography.labelLarge, color = TextSecondary)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                types.forEach { t ->
                    FilterChip(
                        selected = selectedType == t,
                        onClick = { selectedType = if (selectedType == t) null else t },
                        label = { Text(t.replaceFirstChar { it.uppercase() }) }
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancel") }
                ContinuumButton(
                    text = "Save",
                    onClick = {
                        if (title.isNotBlank()) {
                            onSave(title, description, selectedPriority, selectedType, dueDate)
                        }
                    },
                    modifier = Modifier.weight(1f),
                    enabled = title.isNotBlank()
                )
            }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TaskShareBottomSheet(
    friends: List<Friend>,
    isLoadingFriends: Boolean,
    initialParticipantIds: Set<String>,
    onDismiss: () -> Unit,
    onSave: (List<String>) -> Unit
) {
    var selected by remember { mutableStateOf(initialParticipantIds) }

    LaunchedEffect(initialParticipantIds) {
        selected = initialParticipantIds
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .padding(horizontal = 24.dp, vertical = 16.dp)
                .fillMaxWidth()
        ) {
            Text("Collaborators", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
            Spacer(Modifier.height(8.dp))
            Text(
                "Choose friends who can see this task. Changes apply when you tap Save.",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
            Spacer(Modifier.height(16.dp))

            when {
                isLoadingFriends -> {
                    Box(Modifier.fillMaxWidth().height(120.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = BrandPurple, modifier = Modifier.size(32.dp))
                    }
                }
                friends.isEmpty() -> {
                    Text("No friends to add yet.", style = MaterialTheme.typography.bodyMedium, color = TextMuted)
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.heightIn(max = 360.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(friends, key = { it.userId }) { friend ->
                            val checked = friend.userId in selected
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selected = if (checked) selected - friend.userId else selected + friend.userId
                                    }
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Checkbox(
                                    checked = checked,
                                    onCheckedChange = {
                                        selected = if (checked) selected - friend.userId else selected + friend.userId
                                    }
                                )
                                AvatarInitials(
                                    name = friend.fullName,
                                    modifier = Modifier.size(40.dp).clip(CircleShape)
                                )
                                Column {
                                    Text(friend.fullName, style = MaterialTheme.typography.bodyLarge, color = TextPrimary)
                                    friend.username?.let {
                                        Text("@$it", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) { Text("Cancel") }
                ContinuumButton(
                    text = "Save",
                    onClick = { onSave(selected.toList()) },
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(Modifier.height(16.dp))
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
