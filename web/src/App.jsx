import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/lib/queryClient';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { useMobile } from '@/hooks/useMobile';
import MobileGate from '@/components/MobileGate';
import MobilePrivacyPage from '@/pages/MobilePrivacyPage';
import MobileTermsPage from '@/pages/MobileTermsPage';

import AppLayout from '@/components/layout/AppLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import TitleManager from '@/components/TitleManager';
import ScrollToTop from '@/components/ScrollToTop';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import AuthCallback from '@/pages/auth/AuthCallback';
import EmailVerified from '@/pages/auth/EmailVerified';

import Landing from '@/pages/Landing';
import Product from '@/pages/Product';
import About from '@/pages/About';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import TermsOfService from '@/pages/legal/TermsOfService';
import Dashboard from '@/pages/Dashboard';
import NotesList from '@/pages/notes/NotesList';
import NoteDetail from '@/pages/notes/NoteDetail';
import NoteEditor from '@/pages/notes/NoteEditor';
import FlashcardSets from '@/pages/flashcards/FlashcardSets';
import FlashcardSetDetail from '@/pages/flashcards/FlashcardSetDetail';
import StudyMode from '@/pages/flashcards/StudyMode';
import FlashcardHistory from '@/pages/flashcards/FlashcardHistory';
import Tasks from '@/pages/tasks/Tasks';
import Calendar from '@/pages/Calendar';
import Friends from '@/pages/friends/Friends';
import MessagesLayout from '@/components/layout/MessagesLayout';
import ApplicationsList from '@/pages/applications/ApplicationsList';
import ApplicationDetail from '@/pages/applications/ApplicationDetail';
import Resumes from '@/pages/resumes/Resumes';
import Activity from '@/pages/Activity';
import Profile from '@/pages/Profile';
import UserProfile from '@/pages/UserProfile';

export default function App() {
  const isMobile = useMobile();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <TitleManager />
          {isMobile ? <Routes>
            {/* Legal pages reachable on mobile without hitting the gate */}
            <Route path="/privacy" element={<MobilePrivacyPage />} />
            <Route path="/terms" element={<MobileTermsPage />} />
            <Route path="*" element={<MobileGate />} />
          </Routes> : <Routes>
            {/* Public pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/product" element={<Product />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />

            {/* Auth — unauthenticated only */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
            {/* Auth — accessible regardless of login state (arrive via email link) */}
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/verify-email" element={<EmailVerified />} />

            {/* Onboarding — authenticated, no AppLayout chrome */}
            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* App — authenticated */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/notes" element={<NotesList />} />
              <Route path="/notes/new" element={<NoteEditor />} />
              <Route path="/notes/view" element={<NoteDetail />} />
              <Route path="/notes/edit" element={<NoteEditor />} />
              <Route path="/flashcards" element={<FlashcardSets />} />
              <Route path="/flashcards/view" element={<FlashcardSetDetail />} />
              <Route path="/flashcards/study" element={<StudyMode />} />
              <Route path="/flashcards/history" element={<FlashcardHistory />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/messages" element={<MessagesLayout />} />
              <Route path="/applications" element={<ApplicationsList />} />
              <Route path="/applications/view" element={<ApplicationDetail />} />
              <Route path="/resumes" element={<Resumes />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/users/view" element={<UserProfile />} />
            </Route>
          </Routes>}
        </BrowserRouter>

      </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
