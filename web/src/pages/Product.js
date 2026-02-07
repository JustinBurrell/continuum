import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Icons for problem cards
const problemIcons = {
  cognitive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  missed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  studying: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  career: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  collaboration: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// Icons for feature sections
const featureIcons = {
  content: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  social: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  careerHub: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  offline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

function Product() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-animate').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-gradient-to-br from-purple-200/30 via-transparent to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/4" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-violet-100/40 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-[#f8f9fa] border-b border-purple-100/30 px-4 sm:px-6 md:px-10 py-2">
        <Navbar />
      </div>

      <div className="relative z-10 flex flex-col px-4 sm:px-6 md:px-10">

        {/* Hero Section */}
        <section className="py-16 md:py-24 lg:py-32 text-center max-w-4xl mx-auto">
          <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4 opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.1s_forwards]">
            Product
          </span>
          <h1 className="font-poppins font-bold text-4xl sm:text-5xl md:text-6xl text-[#111827] leading-[1.1] tracking-tight mb-6 opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.2s_forwards]">
            The unbroken path from{' '}
            <span className="bg-gradient-to-r from-[#6b21a8] via-[#7c3aed] to-[#a855f7] bg-clip-text text-transparent">
              classroom to career
            </span>
          </h1>
          <p className="font-inter text-lg sm:text-xl md:text-2xl text-[#4b5563] leading-relaxed max-w-3xl mx-auto opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.4s_forwards]">
            Continuum is an all-in-one educational platform designed to eliminate the fragmentation students face when managing their academic and professional lives.
          </p>
        </section>

        {/* Problem Statement Section */}
        <section className="py-16 md:py-24">
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 text-center mb-12 md:mb-16">
            <span className="inline-block font-inter text-sm font-semibold text-[#dc2626] tracking-widest uppercase mb-4">
              The Problem
            </span>
            <h2 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-[#111827] leading-tight mb-6">
              Fragmentation is killing
              <br />
              <span className="text-[#dc2626]">student productivity</span>
            </h2>
            <p className="font-inter text-lg md:text-xl text-[#6b7280] max-w-3xl mx-auto leading-relaxed">
              Modern students navigate a complex digital landscape across 8-12 disconnected applications. Their workflow is scattered, creating critical problems that actively work against their success.
            </p>
          </div>

          {/* Problem Cards - First Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            <ProblemCard
              icon={problemIcons.cognitive}
              title="Cognitive Overhead"
              description="Students lose 2-3 hours per week just switching between tools and remembering where information lives. Context-switching destroys the deep focus needed for learning."
              delay="0"
            />
            <ProblemCard
              icon={problemIcons.missed}
              title="Missed Opportunities"
              description="Important deadlines and tasks fall through the cracks when information lives in silos. Disconnected systems mean disconnected outcomes."
              delay="100"
            />
            <ProblemCard
              icon={problemIcons.studying}
              title="Inefficient Studying"
              description="Notes remain static documents instead of becoming active learning materials. Converting them into study materials requires manual effort across multiple tools."
              delay="200"
            />
          </div>

          {/* Problem Cards - Second Row (Centered) */}
          <div className="flex flex-col md:flex-row justify-center gap-6 md:gap-8 max-w-6xl mx-auto mt-6 md:mt-8">
            <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
              <ProblemCard
                icon={problemIcons.career}
                title="Career Management Chaos"
                description="Job applications lack proper tracking, leading to missed follow-ups and lost opportunities. Excel spreadsheets aren't cutting it anymore."
                delay="300"
              />
            </div>
            <div className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]">
              <ProblemCard
                icon={problemIcons.collaboration}
                title="Collaboration Friction"
                description="Sharing resources and coordinating with peers requires multiple tools and manual effort. 'Which group chat was that in?' shouldn't be a daily question."
                delay="400"
              />
            </div>
          </div>

          {/* The Insight */}
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 mt-16 md:mt-20 max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-[#fef2f2] to-[#fff7ed] rounded-3xl p-8 md:p-12 border border-red-100/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-100/30 to-transparent rounded-bl-full" />
              <div className="relative z-10">
                <p className="font-inter text-lg md:text-xl text-[#374151] leading-relaxed">
                  <span className="font-semibold text-[#dc2626]">The core insight:</span> These aren't separate workflows—they're one continuous journey from content consumption → active learning → task execution → career preparation. Students need a unified platform that respects this natural flow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-16 md:py-24">
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 text-center mb-12 md:mb-16">
            <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4">
              The Solution
            </span>
            <h2 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-[#111827] leading-tight mb-6">
              One platform,{' '}
              <span className="bg-gradient-to-r from-[#6b21a8] to-[#a855f7] bg-clip-text text-transparent">
                zero context-switching
              </span>
            </h2>
            <p className="font-inter text-lg md:text-xl text-[#6b7280] max-w-3xl mx-auto leading-relaxed">
              Continuum reimagines the student experience by creating an intelligent, interconnected platform where everything a student needs exists in one place.
            </p>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            <ValueProp
              title="For Daily Learning"
              description="Import Google Docs with one click. Transform any note into AI-generated summaries and flashcards. Study with an intuitive, Quizlet-style interface—all without leaving the app."
              delay="0"
            />
            <ValueProp
              title="For Time Management"
              description="Create tasks directly from notes. View everything in a calendar that actually understands student life. Share tasks with group project members and watch them sync across everyone's calendar."
              delay="100"
            />
            <ValueProp
              title="For Collaboration"
              description="Share notes and flashcards with friends. Comment and discuss directly on content. Coordinate through built-in messaging. No more 'which group chat was that in?'"
              delay="200"
            />
            <ValueProp
              title="For Career Success"
              description="Store resume versions with AI-powered feedback on each iteration. Track every application with status, networking contacts, and follow-up dates. Timeline view shows your entire job search at a glance."
              delay="300"
            />
          </div>

          {/* Core Belief */}
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-[#6b21a8] via-[#7c3aed] to-[#a855f7] rounded-3xl p-8 md:p-12 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-60 h-60 border border-white rounded-full translate-x-1/3 translate-y-1/3" />
              </div>
              <div className="relative z-10 text-center">
                <p className="font-poppins font-semibold text-xl md:text-2xl text-white leading-relaxed">
                  "When students spend less time managing tools, they have more energy for actual learning and growth."
                </p>
                <p className="font-inter text-white/70 mt-4">— Our Core Belief</p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-16 md:py-24">
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 text-center mb-12 md:mb-16">
            <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4">
              Core Features
            </span>
            <h2 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-[#111827] leading-tight mb-6">
              Built for the modern student
            </h2>
          </div>

          {/* Feature Sections */}
          <div className="space-y-12 md:space-y-16 max-w-5xl mx-auto">
            <FeatureSection
              icon={featureIcons.content}
              title="Intelligent Content Management"
              philosophy="Your notes should work for you, not the other way around."
              capabilities={[
                "Seamless Google Docs integration with one-click import",
                "Clean, focused reading interface optimized for comprehension",
                "Manual snapshot refresh to capture latest document versions",
                "Tagging and organization system for easy retrieval",
                "Privacy controls for personal vs. shareable content"
              ]}
              delay="0"
            />
            <FeatureSection
              icon={featureIcons.ai}
              title="AI-Powered Learning Tools"
              philosophy="Every note is a potential study session."
              capabilities={[
                "Instant summary generation in two formats: quick overview and detailed review",
                "Automatic flashcard creation with intelligent concept extraction",
                "Quizlet-style study interface with flip animations",
                "Manual flashcard editing for personalized learning",
                "Smart card generation that identifies key concepts and definitions"
              ]}
              delay="100"
              reverse
            />
            <FeatureSection
              icon={featureIcons.calendar}
              title="Integrated Task & Calendar System"
              philosophy="Tasks and time should exist in the same view."
              capabilities={[
                "Task creation with priority levels, durations, and deadlines",
                "Direct linking between tasks and related notes",
                "Calendar views (week/month) showing all commitments",
                "Overdue detection and notifications",
                "Time estimation to prevent overcommitment"
              ]}
              delay="200"
            />
            <FeatureSection
              icon={featureIcons.social}
              title="Social Collaboration"
              philosophy="Learning happens better together."
              capabilities={[
                "Friend system with request-based connections",
                "One-click note and flashcard sharing",
                "Commenting and discussion threads on shared content",
                "Shared tasks that appear on all participants' calendars",
                "Private direct messaging for coordination"
              ]}
              delay="300"
              reverse
            />
            <FeatureSection
              icon={featureIcons.careerHub}
              title="Career Development Hub"
              philosophy="Professional preparation shouldn't be an afterthought."
              capabilities={[
                "Multi-version resume storage with AI-powered feedback",
                "Centralized application dashboard with pipeline visualization",
                "Networking tracking with contact names and interaction history",
                "Follow-up reminders for relationship building",
                "Notes section for interview prep and company research"
              ]}
              delay="400"
            />
            <FeatureSection
              icon={featureIcons.offline}
              title="Offline-First Architecture"
              philosophy="Learning doesn't stop when wifi does."
              capabilities={[
                "Local caching of all viewed notes and content",
                "Full task management offline",
                "Flashcard studying without internet",
                "Offline message composition with automatic send on reconnect",
                "Visual indicators for sync status"
              ]}
              delay="500"
              reverse
            />
          </div>
        </section>

        {/* Technical Highlights */}
        <section className="py-16 md:py-24">
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 text-center mb-12 md:mb-16">
            <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4">
              Under the Hood
            </span>
            <h2 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-[#111827] leading-tight mb-6">
              Built with modern technology
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 max-w-5xl mx-auto">
            <TechBadge name="React" description="Web Frontend" />
            <TechBadge name="React Native" description="Mobile Apps" />
            <TechBadge name="Node.js" description="Backend" />
            <TechBadge name="MongoDB" description="Database" />
            <TechBadge name="Groq API" description="AI Integration" />
            <TechBadge name="Google APIs" description="Docs & Drive" />
          </div>
        </section>

        {/* CTA Section */}
        <section className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 py-16 md:py-24">
          <div className="relative bg-gradient-to-br from-[#6b21a8] via-[#7c3aed] to-[#a855f7] rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-60 h-60 border border-white rounded-full translate-x-1/3 translate-y-1/3" />
              <div className="absolute top-1/2 left-1/2 w-80 h-80 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="relative z-10 text-center">
              <h2 className="font-poppins font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight mb-4">
                Ready to simplify your
                <br />
                student life?
              </h2>
              <p className="font-inter text-base md:text-lg text-white/80 max-w-xl mx-auto mb-8">
                Join students who are already experiencing the seamless transition from classroom to career.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-[#6b21a8] font-inter font-semibold text-base px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5"
              >
                Get Started Free
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* Global styles for animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scroll-animate.animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `}</style>
    </div>
  );
}

// Problem Card Component
function ProblemCard({ icon, title, description, delay }) {
  return (
    <div
      className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 group relative bg-white rounded-2xl p-6 md:p-8 border border-red-100/50 hover:border-red-200 hover:shadow-xl hover:-translate-y-2"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-50 rounded-xl flex items-center justify-center text-[#dc2626] mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="font-poppins font-semibold text-xl text-[#111827] mb-3">
          {title}
        </h3>
        <p className="font-inter text-sm md:text-base text-[#6b7280] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// Value Prop Component
function ValueProp({ title, description, delay }) {
  return (
    <div
      className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 relative bg-white rounded-2xl p-6 md:p-8 border border-purple-100/50 hover:shadow-lg transition-shadow duration-300"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <h3 className="font-poppins font-semibold text-xl text-[#6b21a8] mb-3">
        {title}
      </h3>
      <p className="font-inter text-[#6b7280] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

// Feature Section Component
function FeatureSection({ icon, title, philosophy, capabilities, delay, reverse }) {
  return (
    <div
      className={`scroll-animate opacity-0 translate-y-8 transition-all duration-700 flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-start`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex-shrink-0">
        <div className="w-16 h-16 bg-gradient-to-br from-[#ede9fe] to-[#f3e8ff] rounded-2xl flex items-center justify-center text-[#6b21a8]">
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-poppins font-bold text-2xl md:text-3xl text-[#111827] mb-2">
          {title}
        </h3>
        <p className="font-inter text-[#6b21a8] italic mb-4">
          "{philosophy}"
        </p>
        <ul className="space-y-2">
          {capabilities.map((cap, index) => (
            <li key={index} className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#6b21a8] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-inter text-[#6b7280]">{cap}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Tech Badge Component
function TechBadge({ name, description }) {
  return (
    <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 bg-white rounded-xl p-4 border border-purple-100/50 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <p className="font-poppins font-semibold text-[#111827]">{name}</p>
      <p className="font-inter text-xs text-[#6b7280] mt-1">{description}</p>
    </div>
  );
}

export default Product;
