import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Image assets
const womanImg = '/assets/images/woman-student.png';
const calendarImg = '/assets/images/calendar.svg';
const indexCardImg = '/assets/images/index-card.png';
const briefcaseImg = '/assets/images/briefcase.png';
const googleDocsImg = '/assets/images/google-docs-logo.png';
const allStarCodeLogo = '/assets/images/allstarcode-logo.png';
const googlePlayLogo = '/assets/images/google-play-logo.png';

function Landing() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col gap-16 px-10 py-4">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="flex items-start justify-between px-10 py-4 min-h-[500px]">
        {/* Left Side - Text */}
        <div className="flex flex-col gap-6 items-start text-left">
          <h1 className="font-poppins font-semibold text-5xl text-[#111827] leading-tight text-left whitespace-nowrap">
            <span className="block">The seamless transition</span>
            <span className="block">from classroom to career</span>
          </h1>

          <p className="font-inter text-xl text-[#6b7280] leading-relaxed text-left">
            Unify your notes, studying, tasks, and career prep in one
            <br />
            platform. No app switching, just seamless progress.
          </p>

          <Link
            to="/register"
            className="bg-[#6b21a8] opacity-90 hover:opacity-100 text-white font-inter font-bold text-lg px-8 py-3 rounded-full inline-block w-fit transition-opacity"
          >
            Get Started Today
          </Link>
        </div>

        {/* Right Side - Hero Image Container */}
        <HeroImage
          womanImg={womanImg}
          calendarImg={calendarImg}
          briefcaseImg={briefcaseImg}
          googleDocsImg={googleDocsImg}
          indexCardImg={indexCardImg}
        />
      </section>

      {/* Featured Section */}
      <section className="flex items-center justify-between px-10 py-2 h-36">
        <p className="font-poppins text-2xl text-black">
          Featured in 2026 Technical Entrepreneurship Incubator
        </p>

        <div className="flex items-center gap-6">
          <img
            src={allStarCodeLogo}
            alt="All Star Code"
            className="h-14 object-contain"
          />
          <img
            src={googlePlayLogo}
            alt="Google Play"
            className="h-12 object-contain"
          />
        </div>
      </section>

      {/* Features Headline */}
      <section
        id="product"
        className="flex items-center justify-between px-12 py-4"
      >
        <div className="bg-[#6b21a8] rounded-xl px-8 py-6 w-96 shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="font-inter font-bold text-5xl text-white text-center">
            Features
          </h2>
        </div>

        <p className="font-inter text-2xl text-black max-w-2xl leading-relaxed">
          Our features allow you to import notes from Google Docs, generate
          AI-powered flashcards, manage tasks with integrated calendars,
          collaborate with friends, and track your entire career journey.
          Everything you need flows seamlessly in one intelligent platform.
        </p>
      </section>

      {/* Features Grid */}
      <section className="flex flex-col gap-6 px-6">
        {/* Top Row */}
        <div className="flex gap-8 px-6">
          <FeatureCard
            title="Smart Notes"
            description="Import your Google Docs instantly and transform them into organized, searchable notes with AI-powered summaries and highlights."
          />
          <FeatureCard
            title="Flashcards"
            description="Generate study-ready flashcards automatically from any note. Study with an interactive flip interface designed for retention."
          />
          <FeatureCard
            title="Unified Calendar"
            description="Manage tasks, deadlines, and group projects in one view. Create shared tasks that sync across your study group's calendars."
          />
        </div>

        {/* Bottom Row */}
        <div className="flex gap-8 px-6">
          <FeatureCard
            title="Social Learning"
            description="Share notes and flashcards with friends, collaborate on assignments, and stay connected through integrated messaging."
          />
          <FeatureCard
            title="Career Hub"
            description="Upload resumes for AI-powered feedback, track applications with networking logs, and manage your entire job search pipeline."
          />
          <FeatureCard
            title="Offline Ready"
            description="Study, take notes, and manage tasks without internet. Everything syncs automatically when you reconnect."
          />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Hero Image Component
function HeroImage({ womanImg, calendarImg, briefcaseImg, googleDocsImg, indexCardImg }) {
  return (
    <div className="relative w-[480px] h-[420px]">
      {/* Jane Doe Card */}
      <div className="absolute -top-2 right-0 bg-[#EDE9FE] text-[#6b21a8] rounded-2xl px-6 py-4 shadow-lg min-w-[280px] z-10">
        <h3 className="font-dm font-medium text-3xl mb-1">Jane Doe</h3>
        <p className="font-work text-sm whitespace-nowrap">Sophomore at Lehigh University</p>
        <p className="font-work text-sm whitespace-nowrap">Business Information Systems Major</p>
      </div>

      {/* Woman Student - positioned so bottom touches calendar top-left */}
      <img
        src={womanImg}
        alt="Student illustration"
        className="absolute top-0 -left-6 w-32 h-32 object-contain z-20"
      />

      {/* Calendar SVG - main central element */}
      <img
        src={calendarImg}
        alt="Calendar"
        className="absolute top-20 left-12 w-[300px] h-[270px]"
      />

      {/* Briefcase - overlapping right edge of calendar */}
      <img
        src={briefcaseImg}
        alt="Briefcase"
        className="absolute top-44 right-20 w-16 h-16 object-contain z-10"
      />

      {/* Google Docs - touching bottom edge of calendar, slightly lower */}
      <img
        src={googleDocsImg}
        alt="Google Docs"
        className="absolute -bottom-4 left-32 w-14 h-20 object-contain z-10"
      />

      {/* Index Card / Flashcard - bottom right, overlapping calendar corner */}
      <img
        src={indexCardImg}
        alt="Flashcard"
        className="absolute bottom-8 right-12 w-32 h-24 object-contain z-10"
      />
    </div>
  );
}

// Feature Card Component
function FeatureCard({ title, description }) {
  return (
    <div className="flex-1 bg-[#ede9fe] px-11 py-9 shadow-md rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-[#e4d4fc] cursor-pointer">
      <h3 className="font-dm font-medium text-4xl text-black mb-4">{title}</h3>
      <p className="font-work text-base text-black leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default Landing;
