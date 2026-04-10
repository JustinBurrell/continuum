package com.continuum.android.core.ui.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.navigation
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import com.continuum.android.core.data.local.LogoutReason
import com.continuum.android.core.ui.LocalNetworkMonitor
import com.continuum.android.core.ui.LocalTokenManager
import com.continuum.android.feature.auth.presentation.*
import com.continuum.android.feature.career.presentation.*
import com.continuum.android.feature.dashboard.presentation.DashboardScreen
import com.continuum.android.feature.flashcards.presentation.*
import com.continuum.android.feature.messaging.presentation.*
import com.continuum.android.feature.notes.presentation.*
import com.continuum.android.feature.profile.presentation.*
import com.continuum.android.feature.social.presentation.*
import com.continuum.android.feature.tasks.presentation.*

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
        const val PRIVACY = "auth/privacy"
        const val TERMS = "auth/terms"
    }

    object Dashboard {
        const val ROOT = "dashboard"
        const val SCREEN = "dashboard/home"
    }

    object Notes {
        const val ROOT = "notes"
        const val LIST = "notes/list"
        const val DETAIL = "notes/detail/{noteId}"
        const val EDITOR = "notes/editor/{noteId}"
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

        fun detail(taskId: String) = "tasks/detail/$taskId"
    }

    object Calendar {
        const val ROOT = "calendar"
        const val SCREEN = "calendar/main"
    }

    object Applications {
        const val ROOT = "applications"
        const val LIST = "applications/list"
    }

    object Resumes {
        const val ROOT = "resumes"
        const val LIST = "resumes/list"
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
        const val USER_PROFILE = "social/user/{userId}"
        const val SHARED_NOTE = "social/shared-note/{noteId}"
        const val CONVERSATIONS = "social/conversations"
        const val CONVERSATION_DETAIL = "social/conversations/{conversationId}"

        fun userProfile(userId: String) = "social/user/$userId"
        fun sharedNote(noteId: String) = "social/shared-note/$noteId"
        fun conversationDetail(conversationId: String) = "social/conversations/$conversationId"
    }

    object Profile {
        const val ROOT = "profile"
        const val SCREEN = "profile/main"
        const val EDIT = "profile/edit"
        const val SETTINGS = "profile/settings"
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
 * - Starts in [AuthRoutes] when [isAuthenticated] is false, [Dashboard] otherwise.
 * - Detects expanded screens (>= 840dp) and renders [ContinuumNavigationRail] instead of bottom bar.
 * - Dashboard is the MainGraph start destination; accessible from the logo icon on any tab screen.
 * - Bottom nav: Notes | Flashcards | Tasks | Career | Social | Profile (6 tabs).
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
    val tokenManager = LocalTokenManager.current
    val navProfileViewModel: NavProfileViewModel = hiltViewModel()
    val navProfile by navProfileViewModel.state.collectAsStateWithLifecycle()

    var remoteLogoutMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        tokenManager.logoutEvent.collect { reason ->
            if (reason == LogoutReason.REMOTE_INVALIDATION) {
                remoteLogoutMessage = "Your session was ended from another device"
            }
            navController.navigate(NavRoutes.Auth.ROOT) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    val isSensitive = sensitiveRoutes.any { currentRoute?.startsWith(it.substringBefore("{")) == true }
    if (isSensitive) onSensitiveScreenEntered() else onSensitiveScreenExited()

    val windowWidthDp = LocalConfiguration.current.screenWidthDp.dp
    val isExpandedScreen = windowWidthDp >= 840.dp

    val isMainScreen = currentRoute != null && !currentRoute.startsWith(NavRoutes.Auth.ROOT)
    val showMainNav = isMainScreen

    val startDestination = if (isAuthenticated) NavRoutes.Dashboard.ROOT else NavRoutes.Auth.ROOT

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) navProfileViewModel.load()
    }

    // Logo tap: navigate to Dashboard from any tab screen
    val onLogoClick: () -> Unit = {
        navController.navigate(NavRoutes.Dashboard.ROOT) {
            popUpTo(navController.graph.findStartDestination().id) {
                inclusive = false
                saveState = true
            }
            launchSingleTop = true
            restoreState = true
        }
    }

    val showDemoBanner = navProfile.isDemo && showMainNav

    if (isExpandedScreen && showMainNav) {
        Row(modifier = Modifier.fillMaxSize()) {
            ContinuumNavigationRail(
                currentRoute = currentRoute,
                navController = navController,
                profileAvatarUrl = navProfile.avatarUrl,
                profileDisplayName = navProfile.displayName
            )
            androidx.compose.foundation.layout.Column(modifier = Modifier.weight(1f)) {
                if (showDemoBanner) com.continuum.android.core.ui.components.DemoBanner()
                NavGraph(
                    navController = navController,
                    startDestination = startDestination,
                    onLogoClick = onLogoClick,
                    remoteLogoutMessage = remoteLogoutMessage,
                    onRemoteLogoutShown = { remoteLogoutMessage = null },
                    modifier = Modifier.weight(1f)
                )
            }
        }
    } else {
        Scaffold(
            bottomBar = {
                if (showMainNav) {
                    ContinuumBottomBar(
                        currentRoute = currentRoute,
                        navController = navController,
                        profileAvatarUrl = navProfile.avatarUrl,
                        profileDisplayName = navProfile.displayName
                    )
                }
            }
        ) { innerPadding ->
            androidx.compose.foundation.layout.Column(modifier = Modifier.padding(innerPadding)) {
                if (showDemoBanner) com.continuum.android.core.ui.components.DemoBanner()
                NavGraph(
                    navController = navController,
                    startDestination = startDestination,
                    onLogoClick = onLogoClick,
                    remoteLogoutMessage = remoteLogoutMessage,
                    onRemoteLogoutShown = { remoteLogoutMessage = null },
                    modifier = Modifier.weight(1f)
                )
            }
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
    onLogoClick: () -> Unit,
    remoteLogoutMessage: String? = null,
    onRemoteLogoutShown: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = startDestination,
        modifier = modifier,
        enterTransition = {
            androidx.compose.animation.fadeIn(
                animationSpec = androidx.compose.animation.core.tween(200)
            ) + slideIntoContainer(
                towards = AnimatedContentTransitionScope.SlideDirection.Start,
                animationSpec = androidx.compose.animation.core.tween(300),
                initialOffset = { fullWidth -> fullWidth / 4 }
            )
        },
        exitTransition = {
            androidx.compose.animation.fadeOut(
                animationSpec = androidx.compose.animation.core.tween(200)
            )
        },
        popEnterTransition = {
            androidx.compose.animation.fadeIn(
                animationSpec = androidx.compose.animation.core.tween(200)
            ) + slideIntoContainer(
                towards = AnimatedContentTransitionScope.SlideDirection.End,
                animationSpec = androidx.compose.animation.core.tween(300),
                initialOffset = { fullWidth -> fullWidth / 4 }
            )
        },
        popExitTransition = {
            androidx.compose.animation.fadeOut(
                animationSpec = androidx.compose.animation.core.tween(200)
            )
        }
    ) {

        // ---- Auth graph ----
        navigation(route = NavRoutes.Auth.ROOT, startDestination = NavRoutes.Auth.LOGIN) {
            composable(route = NavRoutes.Auth.LOGIN) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(NavRoutes.Dashboard.ROOT) {
                            popUpTo(NavRoutes.Auth.ROOT) { inclusive = true }
                        }
                    },
                    onNavigateToRegister = { navController.navigate(NavRoutes.Auth.REGISTER) },
                    onNavigateToForgotPassword = { navController.navigate(NavRoutes.Auth.FORGOT_PASSWORD) },
                    onNavigateToPrivacy = { navController.navigate(NavRoutes.Auth.PRIVACY) },
                    onNavigateToTerms = { navController.navigate(NavRoutes.Auth.TERMS) },
                    remoteLogoutMessage = remoteLogoutMessage,
                    onRemoteLogoutShown = onRemoteLogoutShown
                )
            }
            composable(route = NavRoutes.Auth.REGISTER) {
                RegisterScreen(
                    onRegisterSuccess = {
                        navController.navigate(NavRoutes.Dashboard.ROOT) {
                            popUpTo(NavRoutes.Auth.ROOT) { inclusive = true }
                        }
                    },
                    onNavigateToLogin = { navController.popBackStack() },
                    onNavigateToPrivacy = { navController.navigate(NavRoutes.Auth.PRIVACY) },
                    onNavigateToTerms = { navController.navigate(NavRoutes.Auth.TERMS) }
                )
            }
            composable(route = NavRoutes.Auth.FORGOT_PASSWORD) {
                ForgotPasswordScreen(onNavigateBack = { navController.popBackStack() })
            }
            composable(
                route = NavRoutes.Auth.RESET_PASSWORD,
                arguments = listOf(navArgument("token") { type = NavType.StringType; defaultValue = "" }),
                deepLinks = listOf(navDeepLink { uriPattern = "continuum://auth/reset-password?token={token}" })
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
                deepLinks = listOf(navDeepLink { uriPattern = "continuum://auth/verify-email?token={token}" })
            ) { backStackEntry ->
                val token = backStackEntry.arguments?.getString("token") ?: ""
                VerifyEmailScreen(
                    token = token,
                    onContinueToApp = {
                        navController.navigate(NavRoutes.Dashboard.ROOT) {
                            popUpTo(NavRoutes.Auth.ROOT) { inclusive = true }
                        }
                    }
                )
            }
            composable(route = NavRoutes.Auth.PRIVACY) {
                LegalDocumentScreen(
                    title = "Privacy Policy",
                    path = "privacy",
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(route = NavRoutes.Auth.TERMS) {
                LegalDocumentScreen(
                    title = "Terms of Service",
                    path = "terms",
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }

        // ---- Dashboard graph ----
        navigation(route = NavRoutes.Dashboard.ROOT, startDestination = NavRoutes.Dashboard.SCREEN) {
            composable(NavRoutes.Dashboard.SCREEN) {
                val networkMonitor = LocalNetworkMonitor.current
                DashboardScreen(
                    onNotesClick = {
                        navController.navigate(NavRoutes.Notes.ROOT) {
                            launchSingleTop = true; restoreState = true
                        }
                    },
                    onTasksClick = {
                        navController.navigate(NavRoutes.Tasks.ROOT) {
                            launchSingleTop = true; restoreState = true
                        }
                    },
                    onFlashcardsClick = {
                        navController.navigate(NavRoutes.Flashcards.ROOT) {
                            launchSingleTop = true; restoreState = true
                        }
                    },
                    onApplicationsClick = {
                        navController.navigate(NavRoutes.Applications.ROOT) {
                            launchSingleTop = true; restoreState = true
                        }
                    },
                    onActivityClick = { navController.navigate(NavRoutes.Social.ACTIVITY_FEED) },
                    onMessagesClick = { navController.navigate(NavRoutes.Social.CONVERSATIONS) },
                    onCalendarClick = { navController.navigate(NavRoutes.Calendar.ROOT) },
                    onNoteClick = { noteId -> navController.navigate(NavRoutes.Notes.detail(noteId)) },
                    onFlashcardSetClick = { setId -> navController.navigate(NavRoutes.Flashcards.setDetail(setId)) },
                    onApplicationClick = { appId -> navController.navigate(NavRoutes.Career.applicationDetail(appId)) },
                    onTaskClick = { taskId -> navController.navigate(NavRoutes.Tasks.detail(taskId)) },
                    networkMonitor = networkMonitor
                )
            }
        }

        // ---- Notes graph ----
        navigation(route = NavRoutes.Notes.ROOT, startDestination = NavRoutes.Notes.LIST) {
            composable(NavRoutes.Notes.LIST) {
                val networkMonitor = LocalNetworkMonitor.current
                NotesListScreen(
                    onNoteClick = { noteId -> navController.navigate(NavRoutes.Notes.detail(noteId)) },
                    onCreateNote = { navController.navigate(NavRoutes.Notes.editor()) },
                    onDriveImport = { navController.navigate(NavRoutes.Notes.DRIVE_IMPORT) },
                    networkMonitor = networkMonitor,
                    onLogoClick = onLogoClick
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
        navigation(route = NavRoutes.Flashcards.ROOT, startDestination = NavRoutes.Flashcards.LIST) {
            composable(NavRoutes.Flashcards.LIST) {
                FlashcardSetsListScreen(
                    onSetClick = { setId -> navController.navigate(NavRoutes.Flashcards.setDetail(setId)) },
                    onStudy = { setId -> navController.navigate(NavRoutes.Flashcards.studyMode(setId)) },
                    onLogoClick = onLogoClick
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
                StudyModeScreen(setId = setId, onNavigateBack = { navController.popBackStack() })
            }
        }

        // ---- Tasks graph ----
        navigation(route = NavRoutes.Tasks.ROOT, startDestination = NavRoutes.Tasks.BOARD) {
            composable(NavRoutes.Tasks.BOARD) {
                val networkMonitor = LocalNetworkMonitor.current
                TaskBoardScreen(
                    onCalendar = { navController.navigate(NavRoutes.Calendar.ROOT) },
                    networkMonitor = networkMonitor,
                    onLogoClick = onLogoClick,
                    onTaskClick = { taskId -> navController.navigate(NavRoutes.Tasks.detail(taskId)) }
                )
            }
            composable(
                route = NavRoutes.Tasks.DETAIL,
                arguments = listOf(navArgument("taskId") { type = NavType.StringType })
            ) { backStackEntry ->
                val taskId = backStackEntry.arguments?.getString("taskId") ?: return@composable
                TaskDetailScreen(
                    taskId = taskId,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }

        navigation(route = NavRoutes.Calendar.ROOT, startDestination = NavRoutes.Calendar.SCREEN) {
            composable(NavRoutes.Calendar.SCREEN) {
                CalendarViewScreen(
                    onNavigateBack = null
                )
            }
        }

        navigation(route = NavRoutes.Applications.ROOT, startDestination = NavRoutes.Applications.LIST) {
            composable(NavRoutes.Applications.LIST) {
                ApplicationsListScreen(
                    onApplicationClick = { appId -> navController.navigate(NavRoutes.Career.applicationDetail(appId)) },
                    onResumesClick = { navController.navigate(NavRoutes.Career.RESUMES_LIST) },
                    onLogoClick = onLogoClick
                )
            }
        }

        // ---- Career graph ----
        navigation(route = NavRoutes.Career.ROOT, startDestination = NavRoutes.Career.APPLICATIONS_LIST) {
            composable(NavRoutes.Career.APPLICATIONS_LIST) {
                ApplicationsListScreen(
                    onApplicationClick = { appId -> navController.navigate(NavRoutes.Career.applicationDetail(appId)) },
                    onLogoClick = onLogoClick
                )
            }
            composable(
                route = NavRoutes.Career.APPLICATION_DETAIL,
                arguments = listOf(navArgument("appId") { type = NavType.StringType })
            ) { backStackEntry ->
                val appId = backStackEntry.arguments?.getString("appId") ?: return@composable
                ApplicationDetailScreen(
                    appId = appId,
                    onNavigateBack = { navController.popBackStack() },
                    onViewResume = { resumeId -> navController.navigate(NavRoutes.Career.resumeDetail(resumeId)) }
                )
            }
            composable(NavRoutes.Career.RESUMES_LIST) {
                ResumesListScreen(
                    onResumeClick = { resumeId -> navController.navigate(NavRoutes.Career.resumeDetail(resumeId)) }
                )
            }
            composable(
                route = NavRoutes.Career.RESUME_DETAIL,
                arguments = listOf(navArgument("resumeId") { type = NavType.StringType })
            ) { backStackEntry ->
                val resumeId = backStackEntry.arguments?.getString("resumeId") ?: return@composable
                ResumeDetailScreen(
                    resumeId = resumeId,
                    onNavigateBack = { navController.popBackStack() },
                    onGetFeedback = { navController.navigate(NavRoutes.Career.resumeFeedback(resumeId)) }
                )
            }
            composable(
                route = NavRoutes.Career.RESUME_FEEDBACK,
                arguments = listOf(navArgument("resumeId") { type = NavType.StringType })
            ) { backStackEntry ->
                val resumeId = backStackEntry.arguments?.getString("resumeId") ?: return@composable
                ResumeFeedbackScreen(resumeId = resumeId, onNavigateBack = { navController.popBackStack() })
            }
        }

        // ---- Social graph ----
        navigation(route = NavRoutes.Social.ROOT, startDestination = NavRoutes.Social.ACTIVITY_FEED) {
            composable(NavRoutes.Social.ACTIVITY_FEED) {
                val networkMonitor = LocalNetworkMonitor.current
                ActivityFeedScreen(
                    onSharedNoteClick = { noteId -> navController.navigate(NavRoutes.Social.sharedNote(noteId)) },
                    onUserClick = { userId -> navController.navigate(NavRoutes.Social.userProfile(userId)) },
                    networkMonitor = networkMonitor,
                    onLogoClick = onLogoClick
                )
            }
            composable(NavRoutes.Social.FRIENDS_LIST) {
                FriendsListScreen(
                    onUserSearch = { navController.navigate(NavRoutes.Social.USER_SEARCH) },
                    onUserClick = { userId -> navController.navigate(NavRoutes.Social.userProfile(userId)) }
                )
            }
            composable(NavRoutes.Social.USER_SEARCH) {
                UserSearchScreen(
                    onNavigateBack = { navController.popBackStack() },
                    onUserClick = { userId -> navController.navigate(NavRoutes.Social.userProfile(userId)) }
                )
            }
            composable(
                route = NavRoutes.Social.USER_PROFILE,
                arguments = listOf(navArgument("userId") { type = NavType.StringType })
            ) { backStackEntry ->
                val userId = backStackEntry.arguments?.getString("userId") ?: return@composable
                UserProfileScreen(
                    userId = userId,
                    onNavigateBack = { navController.popBackStack() }
                )
            }
            composable(
                route = NavRoutes.Social.SHARED_NOTE,
                arguments = listOf(navArgument("noteId") { type = NavType.StringType })
            ) { backStackEntry ->
                val noteId = backStackEntry.arguments?.getString("noteId") ?: return@composable
                SharedNoteViewScreen(noteId = noteId, onNavigateBack = { navController.popBackStack() })
            }
            composable(NavRoutes.Social.CONVERSATIONS) {
                val networkMonitor = LocalNetworkMonitor.current
                ConversationsScreen(
                    onConversationClick = { conversationId ->
                        navController.navigate(NavRoutes.Social.conversationDetail(conversationId))
                    },
                    networkMonitor = networkMonitor,
                    onLogoClick = onLogoClick
                )
            }
            composable(
                route = NavRoutes.Social.CONVERSATION_DETAIL,
                arguments = listOf(navArgument("conversationId") { type = NavType.StringType })
            ) { backStackEntry ->
                val conversationId = backStackEntry.arguments?.getString("conversationId") ?: return@composable
                ConversationDetailScreen(
                    conversationId = conversationId,
                    participantName = "Conversation",
                    onNavigateBack = { navController.popBackStack() }
                )
            }
        }

        // ---- Profile graph ----
        navigation(route = NavRoutes.Profile.ROOT, startDestination = NavRoutes.Profile.SCREEN) {
            composable(NavRoutes.Profile.SCREEN) {
                ProfileScreen(
                    onLogoClick = onLogoClick,
                    onEditProfile = { navController.navigate(NavRoutes.Profile.EDIT) },
                    onSettings = { navController.navigate(NavRoutes.Profile.SETTINGS) },
                    onLogout = {
                        navController.navigate(NavRoutes.Auth.ROOT) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onFriends = { navController.navigate(NavRoutes.Social.FRIENDS_LIST) },
                    onMessages = { navController.navigate(NavRoutes.Social.CONVERSATIONS) },
                    onActivity = { navController.navigate(NavRoutes.Social.ACTIVITY_FEED) },
                    onCalendar = { navController.navigate(NavRoutes.Calendar.ROOT) },
                    onResumes = { navController.navigate(NavRoutes.Career.RESUMES_LIST) }
                )
            }
            composable(NavRoutes.Profile.EDIT) {
                EditProfileScreen(onNavigateBack = { navController.popBackStack() })
            }
            composable(NavRoutes.Profile.SETTINGS) {
                SettingsScreen(onNavigateBack = { navController.popBackStack() })
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Placeholder — replaced by real screens in Phase 8
// ---------------------------------------------------------------------------

@Composable
private fun PlaceholderScreen(name: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = name)
    }
}
