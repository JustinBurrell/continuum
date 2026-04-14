@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
package com.continuum.android.feature.flashcards.presentation

import androidx.compose.animation.AnimatedVisibility
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
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import com.continuum.android.core.ui.LocalIsDemo
import com.continuum.android.core.ui.LocalTokenManager
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*
import com.continuum.android.core.ui.utils.toDisplayDate
import com.continuum.android.feature.flashcards.domain.Flashcard
import com.continuum.android.feature.social.presentation.SocialViewModel

private enum class SetDetailTab { Cards, History, Comments }

@Composable
fun FlashcardSetDetailScreen(
    setId: String,
    onNavigateBack: () -> Unit,
    onStudy: () -> Unit,
    onUserProfileClick: ((String) -> Unit)? = null,
    viewModel: FlashcardsViewModel = hiltViewModel(),
    socialViewModel: SocialViewModel = hiltViewModel()
) {
    val state by viewModel.detailState.collectAsStateWithLifecycle()
    val historyState by viewModel.setDetailHistoryState.collectAsStateWithLifecycle()
    val commentsState by socialViewModel.threadCommentsState.collectAsStateWithLifecycle()
    val isDemo = LocalIsDemo.current
    val tokenManager = LocalTokenManager.current
    var showAddSheet by remember { mutableStateOf(false) }
    var editingCard by remember { mutableStateOf<Flashcard?>(null) }
    var cardToDelete by remember { mutableStateOf<Flashcard?>(null) }
    var tab by remember(setId) { mutableStateOf(SetDetailTab.Cards) }
    var showMoreMenu by remember { mutableStateOf(false) }
    var showEditSheet by remember { mutableStateOf(false) }
    var editTitle by remember { mutableStateOf("") }
    var editDescription by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(setId) {
        viewModel.loadSetDetail(setId)
        socialViewModel.loadThreadComments("flashcard_set", setId)
    }

    LaunchedEffect(setId, tab) {
        if (tab == SetDetailTab.History) viewModel.loadSetStudyHistory(setId)
    }

    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle, setId, tab) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME && tab == SetDetailTab.History) {
                viewModel.loadSetStudyHistory(setId)
            }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                MinimalTopBar(
                    title = "Flashcards",
                    onNavigateBack = onNavigateBack,
                    actions = {
                        TextButton(onClick = onStudy) {
                            Text("Study", color = BrandPurple)
                        }
                        if (!isDemo) {
                            Box {
                                IconButton(onClick = { showMoreMenu = true }) {
                                    Icon(Icons.Default.MoreVert, contentDescription = "More options", tint = TextPrimary)
                                }
                                DropdownMenu(expanded = showMoreMenu, onDismissRequest = { showMoreMenu = false }) {
                                    DropdownMenuItem(
                                        text = { Text("Edit") },
                                        leadingIcon = { Icon(Icons.Default.Edit, null) },
                                        onClick = {
                                            editTitle = state.set?.title ?: ""
                                            editDescription = state.set?.description ?: ""
                                            showEditSheet = true
                                            showMoreMenu = false
                                        }
                                    )
                                    DropdownMenuItem(
                                        text = { Text("Make public") },
                                        leadingIcon = { Icon(Icons.Default.Share, null) },
                                        onClick = {
                                            viewModel.makeSetPublic(setId)
                                            showMoreMenu = false
                                        }
                                    )
                                    DropdownMenuItem(
                                        text = { Text("Duplicate") },
                                        leadingIcon = { Icon(Icons.Default.ContentCopy, null) },
                                        onClick = {
                                            viewModel.duplicateSet(setId)
                                            showMoreMenu = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                )
            }
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                // "Created by" attribution — only for sets owned by someone else
                val myId = tokenManager.getJwtUserId()
                val setOwnerUserId = state.set?.ownerUserId
                val setOwnerName = state.set?.ownerName
                if (setOwnerUserId != null && setOwnerUserId != myId && !setOwnerName.isNullOrBlank() && onUserProfileClick != null) {
                    TextButton(
                        onClick = { onUserProfileClick(setOwnerUserId) },
                        modifier = Modifier.padding(horizontal = 8.dp)
                    ) {
                        Icon(androidx.compose.material.icons.Icons.Default.Person, contentDescription = null, tint = BrandPurple, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Created by $setOwnerName", color = BrandPurple, style = MaterialTheme.typography.labelMedium)
                    }
                }
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = tab == SetDetailTab.Cards,
                        onClick = { tab = SetDetailTab.Cards },
                        label = { Text("Cards") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandPurple,
                            selectedLabelColor = White
                        )
                    )
                    FilterChip(
                        selected = tab == SetDetailTab.History,
                        onClick = { tab = SetDetailTab.History },
                        label = { Text("History") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandPurple,
                            selectedLabelColor = White
                        )
                    )
                    FilterChip(
                        selected = tab == SetDetailTab.Comments,
                        onClick = { tab = SetDetailTab.Comments },
                        label = { Text("Comments") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BrandPurple,
                            selectedLabelColor = White
                        )
                    )
                }

                when (tab) {
                    SetDetailTab.Cards -> {
                        when {
                            state.isLoading && state.cards.isEmpty() -> {
                                LazyColumn(
                                    contentPadding = PaddingValues(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    items(5) { SkeletonLoader(modifier = Modifier.fillMaxWidth().height(70.dp)) }
                                }
                            }

                            state.cards.isEmpty() -> {
                                EmptyState(
                                    icon = Icons.Default.Style,
                                    headline = "No cards yet",
                                    subtext = "Tap + to add your first card",
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            else -> {
                                LazyColumn(
                                    contentPadding = PaddingValues(16.dp),
                                    verticalArrangement = Arrangement.spacedBy(12.dp),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    items(state.cards, key = { it.id }) { card ->
                                        CardItem(
                                            card = card,
                                            onEdit = if (isDemo) null else { { editingCard = card } },
                                            onDelete = if (isDemo) null else { { cardToDelete = card } }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    SetDetailTab.History -> {
                        PullToRefreshBox(
                            isRefreshing = historyState.isLoading && historyState.sessions.isNotEmpty(),
                            onRefresh = { viewModel.loadSetStudyHistory(setId) },
                            modifier = Modifier.weight(1f)
                        ) {
                            when {
                                historyState.isLoading && historyState.sessions.isEmpty() -> {
                                    LazyColumn(
                                        contentPadding = PaddingValues(16.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        items(4) {
                                            SkeletonLoader(modifier = Modifier.fillMaxWidth().height(72.dp))
                                        }
                                    }
                                }

                                historyState.error != null && historyState.sessions.isEmpty() -> {
                                    EmptyState(
                                        icon = Icons.Default.History,
                                        headline = "Could not load history",
                                        subtext = historyState.error ?: "",
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }

                                historyState.sessions.isEmpty() -> {
                                    EmptyState(
                                        icon = Icons.Default.History,
                                        headline = "No study sessions yet",
                                        subtext = "Hit Study to start!",
                                        modifier = Modifier.fillMaxSize()
                                    )
                                }

                                else -> {
                                    LazyColumn(
                                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        items(historyState.sessions, key = { it.id }) { session ->
                                            FlashcardStudySessionRow(
                                                session = session,
                                                titleLine = "${session.correctCount}/${session.totalCards} correct",
                                                subtitleLine = "${session.score}% score · ${session.totalCards} cards · " +
                                                    "${formatStudySessionDuration(session.durationSeconds)} · " +
                                                    session.completedAt.toDisplayDate()
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    SetDetailTab.Comments -> {
                        CommentThread(
                            comments = commentsState.comments,
                            onAddComment = { content, parentId -> socialViewModel.addThreadComment(content, parentId) },
                            onLikeComment = { commentId -> socialViewModel.likeThreadComment(commentId) },
                            onDeleteComment = { commentId -> socialViewModel.deleteThreadComment(commentId) },
                            onUserClick = onUserProfileClick,
                            isSending = commentsState.isSending,
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 16.dp)
                        )
                    }
                }
            }
        }

        if (!isDemo && tab == SetDetailTab.Cards) {
            FloatingActionButton(
                onClick = { showAddSheet = true },
                containerColor = BrandPurple,
                contentColor = White,
                modifier = Modifier.align(Alignment.BottomEnd).padding(16.dp)
            ) {
                Icon(Icons.Default.Add, "Add card")
            }
        }
    }

    cardToDelete?.let { card ->
        AlertDialog(
            onDismissRequest = { cardToDelete = null },
            title = { Text("Delete card?") },
            text = { Text("\"${card.front}\" will be deleted.") },
            confirmButton = {
                TextButton(onClick = { viewModel.deleteCard(setId, card.id); cardToDelete = null }) {
                    Text("Delete", color = ErrorRed)
                }
            },
            dismissButton = { TextButton(onClick = { cardToDelete = null }) { Text("Cancel") } }
        )
    }

    if (showAddSheet) {
        CardEditSheet(
            title = "Add card",
            initialFront = "",
            initialBack = "",
            onDismiss = { showAddSheet = false },
            onSave = { front, back -> viewModel.addCard(setId, front, back); showAddSheet = false }
        )
    }

    editingCard?.let { card ->
        CardEditSheet(
            title = "Edit card",
            initialFront = card.front,
            initialBack = card.back,
            onDismiss = { editingCard = null },
            onSave = { front, back -> viewModel.updateCard(setId, card.id, front, back); editingCard = null }
        )
    }

    if (showEditSheet) {
        ModalBottomSheet(onDismissRequest = { showEditSheet = false }) {
            Column(
                modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Edit Set", style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
                OutlinedTextField(
                    value = editTitle,
                    onValueChange = { editTitle = it },
                    label = { Text("Title") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                OutlinedTextField(
                    value = editDescription,
                    onValueChange = { editDescription = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = BrandPurple, cursorColor = BrandPurple)
                )
                ContinuumButton(
                    text = "Save",
                    onClick = {
                        viewModel.updateSetInfo(setId, editTitle, editDescription)
                        showEditSheet = false
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = editTitle.isNotBlank()
                )
            }
        }
    }
}

@Composable
private fun CardItem(
    card: Flashcard,
    onEdit: (() -> Unit)?,
    onDelete: (() -> Unit)?
) {
    var expanded by remember { mutableStateOf(false) }
    val cardContent: @Composable () -> Unit = {
        ContinuumCard(
            modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded }
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(card.front, style = MaterialTheme.typography.bodyMedium, color = TextPrimary, modifier = Modifier.weight(1f))
                    Icon(
                        if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        null,
                        tint = TextMuted
                    )
                }
                AnimatedVisibility(visible = expanded) {
                    Column {
                        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = Border)
                        Text(card.back, style = MaterialTheme.typography.bodyMedium, color = BrandPurple)
                    }
                }
            }
        }
    }

    if (onEdit == null && onDelete == null) {
        cardContent()
    } else {
        val swipeToDismissState = rememberSwipeToDismissBoxState(
            confirmValueChange = { value ->
                if (value == SwipeToDismissBoxValue.StartToEnd) {
                    onEdit?.invoke()
                    false
                } else if (value == SwipeToDismissBoxValue.EndToStart) {
                    onDelete?.invoke()
                    false
                } else false
            }
        )

        SwipeToDismissBox(
            state = swipeToDismissState,
            backgroundContent = {
                Box(Modifier.fillMaxSize()) {
                    if (swipeToDismissState.dismissDirection == SwipeToDismissBoxValue.StartToEnd) {
                        Box(Modifier.fillMaxSize().padding(start = 16.dp), contentAlignment = Alignment.CenterStart) {
                            Icon(Icons.Default.Edit, null, tint = BrandPurple)
                        }
                    } else {
                        Box(Modifier.fillMaxSize().padding(end = 16.dp), contentAlignment = Alignment.CenterEnd) {
                            Icon(Icons.Default.Delete, null, tint = ErrorRed)
                        }
                    }
                }
            }
        ) {
            cardContent()
        }
    }
}

@Composable
private fun CardEditSheet(
    title: String,
    initialFront: String,
    initialBack: String,
    onDismiss: () -> Unit,
    onSave: (front: String, back: String) -> Unit
) {
    var front by remember { mutableStateOf(initialFront) }
    var back by remember { mutableStateOf(initialBack) }

    LaunchedEffect(initialFront, initialBack) {
        front = initialFront
        back = initialBack
    }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp).imePadding(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(title, style = MaterialTheme.typography.headlineSmall, color = TextPrimary)
            ContinuumTextField(value = front, onValueChange = { front = it }, label = "Front (question)", singleLine = false, maxLines = 3)
            ContinuumTextField(value = back, onValueChange = { back = it }, label = "Back (answer)", singleLine = false, maxLines = 3)
            ContinuumButton(
                text = "Save",
                onClick = { if (front.isNotBlank() && back.isNotBlank()) onSave(front, back) },
                modifier = Modifier.fillMaxWidth(),
                enabled = front.isNotBlank() && back.isNotBlank()
            )
            Spacer(Modifier.height(16.dp))
        }
    }
}
