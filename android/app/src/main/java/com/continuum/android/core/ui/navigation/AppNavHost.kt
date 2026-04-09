package com.continuum.android.core.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.navigation
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import com.continuum.android.core.ui.LocalNetworkMonitor
import com.continuum.android.feature.auth.presentation.*
import com.continuum.android.feature.flashcards.presentation.*
import com.continuum.android.feature.notes.presentation.*

// ---------------------------------------------------------------------------
// Route constants
// ---------------------------------------------------------------------------

object NavRoutes {
    object Auth {
        const val ROOT = "auth"
        const val LOGIN = "auth/login"
        const val REGISTER = "auth/register"
        const val FORGOT_PASSWORD = "auth/forgot-password"
        const val RESET_PASSWORD = "auth/reset-password"
        const val VERIFY_EMAIL = "auth/verify-email"
    }

    object Notes {
        const val ROOT = "notes"
        const val LIST = "notes/list"
        const val DETAIL = "notes/detail/{noteId}"
        const val EDITOR = "notes/editor/{noteId}"   // noteId = "new" for create
        const val DRIVE_IMPORT = "notes/drive-import"

        fun detail(noteId: String) = "notes/detail/$noteId"
        fun editor(noteId: String = "new") = "notes/editor/$noteId"
    }

    object Flashcards {
        const val ROOT = "flashcards"
        const val LIST = "flashcards/list"
        const val SET_DETAIL = "flashcards/set/{setId}"
        const val STUDY_MODE = "flashcards/study/{setId}"

        fun setDetail(setId: String) = "flashcards/set/$setId"
        fun studyMode(setId: String) = "flashcards/study/$setId"
    }

    object Tasks {
        const val ROOT = "tasks"
        const val BOARD = "tasks/board"
        const val DETAIL = "tasks/detail/{taskId}"
        const val CALENDAR = "tasks/calendar"

        fun detail(taskId: String) = "tasks/detail/$taskId"
    }

    object Career {
        const val ROOT = "career"
        const val APPLICATIONS_LIST = "career/applications"
        const val APPLICATION_DETAIL = "career/applications/{appId}"
        const val RESUMES_LIST = "career/resumes"
        const val RESUME_DETAIL = "career/resumes/{resumeId}"
        const val RESUME_FEEDBACK = "career/resumes/{resumeId}/feedback"

        fun applicationDetail(appId: String) = "career/applications/$appId"
        fun resumeDetail(resumeId: String) = "career/resumes/$resumeId"
        fun resumeFeedback(resumeId: String) = "career/resumes/$resumeId/feedback"
    }

    object Social {
        const val ROOT = "social"
        const val ACTIVITY_FEED = "social/activity"
        const val FRIENDS_LIST = "social/friends"
        const val USER_SEARCH = "social/search"
        const val SHARED_NOTE = "social/shared-note/{noteId}"
        const val CONVERSATIONS = "social/conversations"
        const val CONVERSATION_DETAIL = "social/conversations/{conversationId}"

        fun sharedNote(noteId: String) = "social/shared-note/$noteId"
        fun conversationDetail(conversationId: String) = "social/conversations/$conversationId"
    }
}

// ---------------------------------------------------------------------------
// Sensitive screen routes — FLAG_SECURE applied when navigating to these
// ---------------------------------------------------------------------------

val sensitiveRoutes = setOf(
    NavRoutes.Notes.DETAIL,
    NavRoutes.Career.RESUME_DETAIL,
    NavRoutes.Career.RESUME_FEEDBACK,
    NavRoutes.Career.APPLICATION_DETAIL,
    NavRoutes.Social.CONVERSATION_DETAIL,
    NavRoutes.Social.SHARED_NOTE
)

// ---------------------------------------------------------------------------
// AppNavHost
// ---------------------------------------------------------------------------

/**
 * Root navigation host for the Continuum app.
 *
 * - Starts in [AuthRoutes] when [isAuthenticated] is false, [MainGraph] otherwise.
 * - Detects expanded screens (>= 840dp width) via [LocalConfiguration] and renders
 *   [ContinuumNavigationRail] instead of [ContinuumBottomBar].
 * - Each bottom nav tab uses saveState/restoreState to preserve back stacks.
 * - Deep links registered:
 *     continuum://auth/verify-email?token={token}
 *     continuum://auth/reset-password?token={token}
 */
@Composable
fun AppNavHost(
    isAuthenticated: Boolean,
    navController: NavHostController = rememberNavController(),
    onSensitiveScreenEntered: () -> Unit = {},
    onSensitiveScreenExited: () -> Unit = {}
) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    // Track FLAG_SECURE transitions
    val isSensitive = sensitiveRoutes.any { currentRoute?.startsWith(it.substringBefore("{")) == true }
    if (isSensitive) onSensitiveScreenEntered() else onSensitiveScreenExited()

    val windowWidthDp = LocalConfiguration.current.screenWidthDp.dp
    val isExpandedScreen = windowWidthDp >= 840.dp
    val showMainNav = currentRoute?.startsWith(NavRoutes.Notes.ROOT) == true ||
        currentRoute?.startsWith(NavRoutes.Flashcards.ROOT) == true ||
        currentRoute?.startsWith(NavRoutes.Tasks.ROOT) == true ||
        currentRoute?.startsWith(NavRoutes.Career.ROOT) == true ||
        currentRoute?.startsWith(NavRoutes.Social.ROOT) == true

    val startDestination = if (isAuthenticated) NavRoutes.Notes.ROOT else NavRoutes.Auth.ROOT

    if (isExpandedScreen && showMainNav) {
        // Tablet / landscape: NavigationRail + content side-by-side
        Row(modifier = Modifier.fillMaxSize()) {
            ContinuumNavigationRail(
                currentRoute = currentRoute,
                navController = navController
            )
            NavGraph(
                navController = navController,
                startDestination = startDestination,
                modifier = Modifier.weight(1f)
            )
        }
    } else {
        Scaffold(
            bottomBar = {
                if (showMainNav) {
                    ContinuumBottomBar(
                        currentRoute = currentRoute,
                        navController = navController
                    )
                }
            }
        ) { innerPadding ->
            NavGraph(
                navController = navController,
                startDestination = startDestination,
                modifier = Modifier.padding(innerPadding)
            )
        }
    }
}

// ---------------------------------------------------------------------------
// NavGraph — full route tree
// ---------------------------------------------------------------------------

@Composable
private fun NavGraph(
    navController: NavHostController,
    startDestination: String,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier
    ) {

        // ---- Auth graph ----
        navigation(
            route = NavRoutes.Auth.ROOT,
            startDestination = NavRoutes.Auth.LOGIN
        ) {
            composable(route = NavRoutes.Auth.LOGIN) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(NavRoutes.Notes.ROOT) {
                            popUpTo(NavRoutes.Auth.ROOT) { inclusive = true }
                        }
                    },
                    onNavigateToRegister = { navController.navigate(NavRoutes.Auth.REGISTER) },
                    onNavigateToForgotPassword = { navController.navigate(NavRoutes.Auth.FORGOT_PASSWORD) }
                )
            }
            composable(route = NavRoutes.Auth.REGISTER) {
                RegisterScreen(
                    onRegisterSuccess = {
                        navController.navigate(NavRoutes.Notes.ROOT) {
                            popUpTo(NavRoutes.Auth.ROOT) { inclusive = true }
                        }
                    },
                    onNavigateToLogin = { navController.popBackStack() }
                )
            }
            composable(route = NavRoutes.Auth.FORGOT_PASSWORD) {
                ForgotPasswordScreen(
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(
                route = NavRoutes.Auth.RESET_PASSWORD,
                arguments = listOf(navArgument("token") { type = NavType.StringType; defaultValue = "" }),
                deepLinks = listOf(
                    navDeepLink { uriPattern = "continuum://auth/reset-password?token={token}" }
                )
            ) { backStackEntry ->
                val token = backStackEntry.arguments?.getString("token") ?: ""
                ResetPasswordScreen(
                    token = token,
                    onNavigateToLogin = {
                        navController.navigate(NavRoutes.Auth.LOGIN) {
                            popUpTo(NavRoutes.Auth.ROOT) { inclusive = false }
                        }
                    }
                )
            }
            composable(
                route = NavRoutes.Auth.VERIFY_EMAIL,
                arguments = listOf(navArgument("token") { type = NavType.StringType; defaultValue = "" }),
                deepLinks = listOf(
                    navDeepLink { uriPattern = "continuum://auth/verify-email?token={token}" }
                )
            ) { backStackEntry ->
                val token = backStackEntry.arguments?.getString("token") ?: ""
                VerifyEmailScreen(
                    token = token,
                    onContinueToApp = {
                        navController.navigate(NavRoutes.Notes.ROOT) {
                            popUpTo(NavRoutes.Auth.ROOT) { inclusive = true }
                        }
                    }
                )
            }
        }

        // ---- Notes graph ----
        navigation(
            route = NavRoutes.Notes.ROOT,
            startDestination = NavRoutes.Notes.LIST
        ) {
            composable(NavRoutes.Notes.LIST) {
                val networkMonitor = LocalNetworkMonitor.current
                NotesListScreen(
                    onNoteClick = { noteId -> navController.navigate(NavRoutes.Notes.detail(noteId)) },
                    onCreateNote = { navController.navigate(NavRoutes.Notes.editor()) },
                    onDriveImport = { navController.navigate(NavRoutes.Notes.DRIVE_IMPORT) },
                    networkMonitor = networkMonitor
                )
            }
            composable(
                route = NavRoutes.Notes.DETAIL,
                arguments = listOf(navArgument("noteId") { type = NavType.StringType })
            ) { backStackEntry ->
                val networkMonitor = LocalNetworkMonitor.current
                val noteId = backStackEntry.arguments?.getString("noteId") ?: return@composable
                NoteDetailScreen(
                    noteId = noteId,
                    onNavigateBack = { navController.popBackStack() },
                    onEdit = { id -> navController.navigate(NavRoutes.Notes.editor(id)) },
                    networkMonitor = networkMonitor
                )
            }
            composable(
                route = NavRoutes.Notes.EDITOR,
                arguments = listOf(navArgument("noteId") { type = NavType.StringType })
            ) { backStackEntry ->
                val networkMonitor = LocalNetworkMonitor.current
                val noteId = backStackEntry.arguments?.getString("noteId") ?: "new"
                NoteEditorScreen(
                    noteId = noteId,
                    onNavigateBack = { navController.popBackStack() },
                    networkMonitor = networkMonitor
                )
            }
            composable(NavRoutes.Notes.DRIVE_IMPORT) {
                GoogleDriveImportScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onImportSuccess = { noteId ->
                        navController.navigate(NavRoutes.Notes.detail(noteId)) {
                            popUpTo(NavRoutes.Notes.DRIVE_IMPORT) { inclusive = true }
                        }
                    }
                )
            }
        }

        // ---- Flashcards graph ----
        navigation(
            route = NavRoutes.Flashcards.ROOT,
            startDestination = NavRoutes.Flashcards.LIST
        ) {
            composable(NavRoutes.Flashcards.LIST) {
                FlashcardSetsListScreen(
                    onSetClick = { setId -> navController.navigate(NavRoutes.Flashcards.setDetail(setId)) },
                    onStudy = { setId -> navController.navigate(NavRoutes.Flashcards.studyMode(setId)) }
                )
            }
            composable(
                route = NavRoutes.Flashcards.SET_DETAIL,
                arguments = listOf(navArgument("setId") { type = NavType.StringType })
            ) { backStackEntry ->
                val setId = backStackEntry.arguments?.getString("setId") ?: return@composable
                FlashcardSetDetailScreen(
                    setId = setId,
                    onNavigateBack = { navController.popBackStack() },
                    onStudy = { navController.navigate(NavRoutes.Flashcards.studyMode(setId)) }
                )
            }
            composable(
                route = NavRoutes.Flashcards.STUDY_MODE,
                arguments = listOf(navArgument("setId") { type = NavType.StringType })
            ) { backStackEntry ->
                val setId = backStackEntry.arguments?.getString("setId") ?: return@composable
                StudyModeScreen(
                    setId = setId,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }

        // ---- Tasks graph ----
        navigation(
            route = NavRoutes.Tasks.ROOT,
            startDestination = NavRoutes.Tasks.BOARD
        ) {
            composable(NavRoutes.Tasks.BOARD) {
                PlaceholderScreen("Tasks Board")
            }
            composable(
                route = NavRoutes.Tasks.DETAIL,
                arguments = listOf(navArgument("taskId") { type = NavType.StringType })
            ) {
                PlaceholderScreen("Task Detail")
            }
            composable(NavRoutes.Tasks.CALENDAR) {
                PlaceholderScreen("Calendar")
            }
        }

        // ---- Career graph ----
        navigation(
            route = NavRoutes.Career.ROOT,
            startDestination = NavRoutes.Career.APPLICATIONS_LIST
        ) {
            composable(NavRoutes.Career.APPLICATIONS_LIST) {
                PlaceholderScreen("Applications List")
            }
            composable(
                route = NavRoutes.Career.APPLICATION_DETAIL,
                arguments = listOf(navArgument("appId") { type = NavType.StringType })
            ) {
                PlaceholderScreen("Application Detail")
            }
            composable(NavRoutes.Career.RESUMES_LIST) {
                PlaceholderScreen("Resumes List")
            }
            composable(
                route = NavRoutes.Career.RESUME_DETAIL,
                arguments = listOf(navArgument("resumeId") { type = NavType.StringType })
            ) {
                PlaceholderScreen("Resume Detail")
            }
            composable(
                route = NavRoutes.Career.RESUME_FEEDBACK,
                arguments = listOf(navArgument("resumeId") { type = NavType.StringType })
            ) {
                PlaceholderScreen("Resume Feedback")
            }
        }

        // ---- Social graph ----
        navigation(
            route = NavRoutes.Social.ROOT,
            startDestination = NavRoutes.Social.ACTIVITY_FEED
        ) {
            composable(NavRoutes.Social.ACTIVITY_FEED) {
                PlaceholderScreen("Activity Feed")
            }
            composable(NavRoutes.Social.FRIENDS_LIST) {
                PlaceholderScreen("Friends List")
            }
            composable(NavRoutes.Social.USER_SEARCH) {
                PlaceholderScreen("User Search")
            }
            composable(
                route = NavRoutes.Social.SHARED_NOTE,
                arguments = listOf(navArgument("noteId") { type = NavType.StringType })
            ) {
                PlaceholderScreen("Shared Note")
            }
            composable(NavRoutes.Social.CONVERSATIONS) {
                PlaceholderScreen("Conversations")
            }
            composable(
                route = NavRoutes.Social.CONVERSATION_DETAIL,
                arguments = listOf(navArgument("conversationId") { type = NavType.StringType })
            ) {
                PlaceholderScreen("Conversation Detail")
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Placeholder — replaced by real screens in Phase 8
// ---------------------------------------------------------------------------

@Composable
private fun PlaceholderScreen(name: String) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(text = name)
    }
}
