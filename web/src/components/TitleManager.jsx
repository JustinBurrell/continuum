import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://usecontinuum.dev';

const TITLES = {
  // Public
  '/': 'Continuum | The Student Workspace',
  '/product': 'Continuum | Features',
  '/about': 'Continuum | About',
  '/privacy': 'Continuum | Privacy Policy',
  '/terms': 'Continuum | Terms of Service',
  '/accessibility': 'Continuum | Accessibility',

  // Auth
  '/login': 'Continuum | Sign In',
  '/register': 'Continuum | Create Account',
  '/forgot-password': 'Continuum | Forgot Password',
  '/reset-password': 'Continuum | Reset Password',
  '/auth/callback': 'Continuum | Signing in',
  '/auth/verify-email': 'Continuum | Verify Email',

  // App
  '/dashboard': 'Continuum | Dashboard',
  '/notes': 'Continuum | Notes',
  '/notes/new': 'Continuum | New Note',
  '/notes/view': 'Continuum | Note',
  '/notes/edit': 'Continuum | Edit Note',
  '/flashcards': 'Continuum | Flashcards',
  '/flashcards/view': 'Continuum | Flashcard Set',
  '/flashcards/study': 'Continuum | Study Mode',
  '/tasks': 'Continuum | Tasks',
  '/calendar': 'Continuum | Calendar',
  '/friends': 'Continuum | Friends',
  '/messages': 'Continuum | Messages',
  '/applications': 'Continuum | Applications',
  '/applications/view': 'Continuum | Application',
  '/resumes': 'Continuum | Resumes',
  '/activity': 'Continuum | Activity',
  '/notifications': 'Continuum | Notifications',
  '/profile': 'Continuum | Settings',
  '/users/view': 'Continuum | Profile',
};

const DESCRIPTIONS = {
  '/': 'The all-in-one workspace built for students: notes, flashcards, tasks, job applications, and more.',
  '/product': 'Notes, flashcards, tasks, and career tools in one place. See everything Continuum can do.',
  '/about': 'Learn about the team behind Continuum and why we built it.',
  '/privacy': 'How Continuum collects, uses, and protects your data.',
  '/terms': 'The terms and conditions governing your use of Continuum.',
  '/accessibility': 'Our commitment to digital accessibility and WCAG AA compliance.',
};

function setMeta(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export default function TitleManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = TITLES[pathname] ?? 'Continuum';
    const description = DESCRIPTIONS[pathname] ?? null;
    const url = `${BASE_URL}${pathname}`;

    document.title = title;

    if (description) {
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[property="og:description"]', 'content', description);
      setMeta('meta[name="twitter:description"]', 'content', description);
    }

    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('link[rel="canonical"]', 'href', url);
  }, [pathname]);

  return null;
}
