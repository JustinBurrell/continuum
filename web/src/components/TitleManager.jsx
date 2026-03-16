import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLES = {
  // Public
  '/': 'Continuum',
  '/product': 'Continuum | Product',
  '/about': 'Continuum | About',

  // Auth
  '/login': 'Continuum | Login',
  '/register': 'Continuum | Register',
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
  '/profile': 'Continuum | Settings',
  '/users/view': 'Continuum | Profile',
};

export default function TitleManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = TITLES[pathname] ?? 'Continuum';
  }, [pathname]);

  return null;
}
