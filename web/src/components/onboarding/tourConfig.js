// Tour step definitions. Dashboard is always index 0 (step 1).
// Sections 1-10 are reordered based on the user's onboarding goal.

const DASHBOARD_STEP = {
  id: 'dashboard',
  sectionName: 'Dashboard',
  heading: 'Welcome to your dashboard',
  description: 'Your home base. See your study streak, recent activity, and quick links to everything.',
  tip: 'Bookmark any section to the top of your dashboard for faster access.',
  sidebarTarget: 'dashboard',
};

const ALL_SECTIONS = [
  {
    id: 'notes',
    sectionName: 'Notes',
    heading: 'Create and organize your notes',
    description: 'Rich-text notes you can tag, search, and share with friends.',
    tip: 'Press Cmd+N (Ctrl+N on Windows) from anywhere in Notes to start a new note instantly.',
    sidebarTarget: 'notes',
  },
  {
    id: 'flashcards',
    sectionName: 'Flashcards',
    heading: 'Study smarter with flashcards',
    description: 'Build flashcard sets and study with spaced repetition to retain what you learn.',
    tip: 'Open any flashcard set and tap "Study" to start a session that tracks your progress.',
    sidebarTarget: 'flashcards',
  },
  {
    id: 'tasks',
    sectionName: 'Tasks',
    heading: 'Track your work with a kanban board',
    description: 'A kanban board for tracking your work across custom columns.',
    tip: 'Drag a card between columns to update its status.',
    sidebarTarget: 'tasks',
  },
  {
    id: 'calendar',
    sectionName: 'Calendar',
    heading: 'See your tasks by due date',
    description: 'A unified view of all your tasks that have due dates.',
    tip: 'Click any day on the calendar to add a task directly from that date.',
    sidebarTarget: 'calendar',
  },
  {
    id: 'applications',
    sectionName: 'Applications',
    heading: 'Track every job application',
    description: 'Track every job application through a built-in pipeline.',
    tip: 'Add your first application and set its stage (Applied, Interview, Offer, etc.).',
    sidebarTarget: 'applications',
  },
  {
    id: 'resumes',
    sectionName: 'Resumes',
    heading: 'Manage your resume versions',
    description: 'Upload and manage versions of your resume in one place.',
    tip: 'Upload a PDF to keep your resume on file and accessible from anywhere.',
    sidebarTarget: 'resumes',
  },
  {
    id: 'messages',
    sectionName: 'Messages',
    heading: 'Message your friends',
    description: 'Direct messages with your friends on Continuum.',
    tip: "Start a conversation from a friend's profile or from the Messages tab.",
    sidebarTarget: 'messages',
  },
  {
    id: 'friends',
    sectionName: 'Friends',
    heading: 'Connect with other students',
    description: 'Find and connect with other Continuum users.',
    tip: 'Search by username to send a friend request.',
    sidebarTarget: 'friends',
  },
  {
    id: 'activity',
    sectionName: 'Activity',
    heading: "See what your friends are up to",
    description: 'See what your friends have been studying and working on.',
    tip: 'Control who sees your activity in your Profile settings under Visibility.',
    sidebarTarget: 'activity',
  },
  {
    id: 'profile',
    sectionName: 'Profile',
    heading: 'Your public page and settings',
    description: 'Your public page, account settings, and social links.',
    tip: 'Add your LinkedIn or Instagram handle so friends can connect with you outside the app.',
    sidebarTarget: 'profile',
  },
];

// Section IDs in the order they should appear for each goal.
// All 10 sections appear for every goal — only the order changes.
const SECTION_ORDER_BY_GOAL = {
  study_smarter:    ['notes', 'flashcards', 'tasks', 'calendar', 'applications', 'resumes', 'messages', 'friends', 'activity', 'profile'],
  track_job_search: ['applications', 'resumes', 'tasks', 'notes', 'flashcards', 'calendar', 'messages', 'friends', 'activity', 'profile'],
  manage_coursework:['tasks', 'calendar', 'notes', 'flashcards', 'applications', 'resumes', 'messages', 'friends', 'activity', 'profile'],
  collaborate:      ['messages', 'friends', 'activity', 'notes', 'flashcards', 'tasks', 'calendar', 'applications', 'resumes', 'profile'],
  not_sure:         ['notes', 'flashcards', 'tasks', 'calendar', 'applications', 'resumes', 'messages', 'friends', 'activity', 'profile'],
};

const sectionMap = Object.fromEntries(ALL_SECTIONS.map(s => [s.id, s]));

// Returns the full ordered list of 11 tour steps for the given goal.
// Dashboard is always first; the remaining 10 sections are goal-ordered.
export function getOrderedTourSteps(goal) {
  const order = SECTION_ORDER_BY_GOAL[goal] ?? SECTION_ORDER_BY_GOAL.not_sure;
  return [DASHBOARD_STEP, ...order.map(id => sectionMap[id])];
}
