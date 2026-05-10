package com.continuum.android.feature.onboarding

data class TourStepConfig(
    val id: String,
    val sectionName: String,
    val heading: String,
    val description: String,
)

private val DASHBOARD_STEP = TourStepConfig(
    id = "dashboard",
    sectionName = "Dashboard",
    heading = "Welcome to your dashboard",
    description = "Your home base. See your study streak, recent activity, and quick links to everything.",
)

private val ALL_SECTIONS = listOf(
    TourStepConfig("notes",        "Notes",        "Create and organize your notes",        "Rich-text notes you can tag, search, and share with friends."),
    TourStepConfig("flashcards",   "Flashcards",   "Study smarter with flashcards",         "Build flashcard sets and study with spaced repetition to retain what you learn."),
    TourStepConfig("tasks",        "Tasks",        "Track your work with a kanban board",   "A kanban board for tracking your work across custom columns."),
    TourStepConfig("calendar",     "Calendar",     "See your tasks by due date",            "A unified view of all your tasks that have due dates."),
    TourStepConfig("applications", "Applications", "Track every job application",           "Track every job application through a built-in pipeline."),
    TourStepConfig("resumes",      "Resumes",      "Manage your resume versions",           "Upload and manage versions of your resume in one place."),
    TourStepConfig("messages",     "Messages",     "Message your friends",                  "Direct messages with your friends on Continuum."),
    TourStepConfig("friends",      "Friends",      "Connect with other students",           "Find and connect with other Continuum users."),
    TourStepConfig("activity",     "Activity",     "See what your friends are up to",       "See what your friends have been studying and working on."),
    TourStepConfig("profile",      "Profile",      "Your public page and settings",         "Your public page, account settings, and social links."),
)

// Fixed navbar order — same for every goal so the tour mirrors the bottom nav.
private val NAVBAR_ORDER = listOf("notes","flashcards","tasks","calendar","applications","resumes","messages","friends","activity","profile")

private val sectionMap = ALL_SECTIONS.associateBy { it.id }

// The goal parameter is kept for API compatibility but no longer affects ordering.
fun getOrderedTourSteps(goal: String?): List<TourStepConfig> {
    return listOf(DASHBOARD_STEP) + NAVBAR_ORDER.mapNotNull { sectionMap[it] }
}

fun getSectionConfig(id: String): TourStepConfig? = sectionMap[id]
