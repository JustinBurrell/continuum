package com.continuum.android.feature.flashcards.presentation

import androidx.compose.animation.core.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.continuum.android.core.ui.components.*
import com.continuum.android.core.ui.theme.*

@Composable
fun StudyModeScreen(
    setId: String,
    onNavigateBack: () -> Unit,
    viewModel: FlashcardsViewModel = hiltViewModel()
) {
    val state by viewModel.studyState.collectAsStateWithLifecycle()
    val haptic = LocalHapticFeedback.current

    LaunchedEffect(setId) { viewModel.startStudy(setId) }

    when {
        state.isLoading -> {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandPurple)
            }
        }

        state.isComplete -> {
            StudySummaryScreen(
                correct = state.correctCount,
                incorrect = state.incorrectCount,
                onStudyAgain = { viewModel.restartStudy() },
                onBack = onNavigateBack
            )
        }

        state.cards.isEmpty() -> {
            EmptyState(
                icon = Icons.AutoMirrored.Filled.ArrowBack,
                headline = "No cards",
                subtext = "This set has no cards to study.",
                actionLabel = "Go back",
                onAction = onNavigateBack,
                modifier = Modifier.fillMaxSize()
            )
        }

        else -> {
            val card = state.cards[state.currentIndex]
            val totalCards = state.cards.size

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .navigationBarsPadding()
            ) {
                // Top bar
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = TextPrimary)
                    }
                    Spacer(Modifier.weight(1f))
                    Text(
                        "${state.currentIndex + 1} / $totalCards",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }

                // Progress bar
                LinearProgressIndicator(
                    progress = { (state.currentIndex + 1).toFloat() / totalCards },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                    color = BrandPurple,
                    trackColor = Border
                )

                Spacer(Modifier.weight(1f))

                // Flash card
                FlipCard(
                    front = card.front,
                    back = card.back,
                    isFlipped = state.isFlipped,
                    onFlip = {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        viewModel.flipCard()
                    },
                    onSwipeLeft = {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        viewModel.answerCard(setId, correct = false)
                    },
                    onSwipeRight = {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        viewModel.answerCard(setId, correct = true)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(300.dp)
                        .padding(horizontal = 24.dp)
                )

                Spacer(Modifier.weight(1f))

                // Action buttons
                if (!state.isFlipped) {
                    ContinuumButton(
                        text = "Reveal answer",
                        onClick = {
                            haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                            viewModel.flipCard()
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp, vertical = 24.dp)
                    )
                } else {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 24.dp, vertical = 24.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        ContinuumButton(
                            text = "Again",
                            onClick = {
                                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                viewModel.answerCard(setId, correct = false)
                            },
                            modifier = Modifier.weight(1f),
                            variant = ContinuumButtonVariant.Secondary
                        )
                        ContinuumButton(
                            text = "Got it",
                            onClick = {
                                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                                viewModel.answerCard(setId, correct = true)
                            },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Text(
                    text = "${state.correctCount} known · ${totalCards - state.correctCount} remaining",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary,
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .padding(bottom = 16.dp)
                )
            }
        }
    }
}

@Composable
private fun FlipCard(
    front: String,
    back: String,
    isFlipped: Boolean,
    onFlip: () -> Unit,
    onSwipeLeft: () -> Unit,
    onSwipeRight: () -> Unit,
    modifier: Modifier = Modifier
) {
    val rotation by animateFloatAsState(
        targetValue = if (isFlipped) 180f else 0f,
        animationSpec = tween(durationMillis = 400, easing = FastOutSlowInEasing),
        label = "card_flip"
    )

    var dragOffsetX by remember { mutableFloatStateOf(0f) }

    Card(
        modifier = modifier
            .graphicsLayer { rotationY = rotation; cameraDistance = 12f * density }
            .pointerInput(Unit) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        when {
                            dragOffsetX < -120f -> onSwipeLeft()
                            dragOffsetX > 120f -> onSwipeRight()
                        }
                        dragOffsetX = 0f
                    },
                    onHorizontalDrag = { _, delta -> dragOffsetX += delta }
                )
            },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        onClick = onFlip
    ) {
        Box(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            if (rotation <= 90f) {
                // Front face
                Text(
                    text = front,
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextPrimary,
                    textAlign = TextAlign.Center
                )
            } else {
                // Back face — mirror to undo the flip
                Text(
                    modifier = Modifier.graphicsLayer { rotationY = 180f },
                    text = back,
                    style = MaterialTheme.typography.bodyLarge.copy(fontStyle = FontStyle.Italic),
                    color = BrandPurple,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun StudySummaryScreen(
    correct: Int,
    incorrect: Int,
    onStudyAgain: () -> Unit,
    onBack: () -> Unit
) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier.padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text("Session complete!", style = MaterialTheme.typography.headlineLarge, color = TextPrimary)

            Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("$correct", style = MaterialTheme.typography.displaySmall, color = SuccessGreen)
                    Text("Correct", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("$incorrect", style = MaterialTheme.typography.displaySmall, color = ErrorRed)
                    Text("Again", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                }
            }

            Spacer(Modifier.height(8.dp))
            ContinuumButton(text = "Study again", onClick = onStudyAgain, modifier = Modifier.fillMaxWidth())
            ContinuumButton(text = "Back to sets", onClick = onBack, modifier = Modifier.fillMaxWidth(), variant = ContinuumButtonVariant.Secondary)
        }
    }
}
