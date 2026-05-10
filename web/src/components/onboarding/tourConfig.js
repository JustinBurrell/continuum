// Tour step definitions. Dashboard is always index 0 (step 1).
// Sections 1-10 are reordered based on the user's onboarding goal.

// pageTarget: data-tour-highlight attribute value on the primary CTA of each section.
// TourStep adds a pulsing purple ring to this element in addition to the sidebar highlight.

const DASHBOARD_STEP = {
  id: 'dashboard',
  sectionName: 'Dashboard',
  heading: 'Welcome to your dashboard',
  description: 'Your home base. See your recent activity, stats, and quick links to everything.',
  sidebarTarget: 'dashboard',
  route: '/dashboard',
  pageTarget: null,
};

const ALL_SECTIONS = [
  {
    id: 'notes',
    sectionName: 'Notes',
    heading: 'Create and organize your notes',
    description: 'Rich-text notes you can tag, search, and share with friends.',
    sidebarTarget: 'notes',
    route: '/notes',
    pageTarget: 'notes-new',
  },
  {
    id: 'flashcards',
    sectionName: 'Flashcards',
    heading: 'Study smarter with flashcards',
    description: 'Build flashcard sets and study with spaced repetition to retain what you learn.',
    sidebarTarget: 'flashcards',
    route: '/flashcards',
    pageTarget: 'flashcards-new',
  },
  {
    id: 'tasks',
    sectionName: 'Tasks',
    heading: 'Track your work with a kanban board',
    description: 'A kanban board for tracking your work across custom columns.',
    sidebarTarget: 'tasks',
    route: '/tasks',
    pageTarget: 'tasks-new',
  },
  {
    id: 'calendar',
    sectionName: 'Calendar',
    heading: 'See your tasks by due date',
    description: 'A unified view of all your tasks that have due dates.',
    sidebarTarget: 'calendar',
    route: '/calendar',
    pageTarget: null,
  },
  {
    id: 'applications',
    sectionName: 'Applications',
    heading: 'Track every job application',
    description: 'Track every job application through a built-in pipeline.',
    sidebarTarget: 'applications',
    route: '/applications',
    pageTarget: 'applications-new',
  },
  {
    id: 'resumes',
    sectionName: 'Resumes',
    heading: 'Manage your resume versions',
    description: 'Upload and manage versions of your resume in one place.',
    sidebarTarget: 'resumes',
    route: '/resumes',
    pageTarget: 'resumes-upload',
  },
  {
    id: 'messages',
    sectionName: 'Messages',
    heading: 'Message your friends',
    description: 'Direct messages with your friends on Continuum.',
    sidebarTarget: 'messages',
    route: '/messages',
    pageTarget: 'messages-new',
  },
  {
    id: 'friends',
    sectionName: 'Friends',
    heading: 'Connect with other students',
    description: 'Find and connect with other Continuum users.',
    sidebarTarget: 'friends',
    route: '/friends',
    pageTarget: 'friends-search',
  },
  {
    id: 'activity',
    sectionName: 'Activity',
    heading: "See what your friends are up to",
    description: 'See what your friends have been studying and working on.',
    sidebarTarget: 'activity',
    route: '/activity',
    pageTarget: null,
  },
  {
    id: 'profile',
    sectionName: 'Profile',
    heading: 'Your public page and settings',
    description: 'Your public page, account settings, and social links.',
    sidebarTarget: 'profile',
    route: '/profile',
    pageTarget: 'profile-edit',
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

// Returns the tour config for a single section by its id (e.g., 'notes', 'tasks').
export function getSectionConfig(id) {
  return sectionMap[id] ?? null;
}
