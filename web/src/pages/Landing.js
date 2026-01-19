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
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col gap-8 md:gap-12 lg:gap-16 px-4 sm:px-6 md:px-10 py-4">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center lg:items-start justify-between px-4 sm:px-6 md:px-10 py-4 gap-8 lg:gap-4 min-h-0 lg:min-h-[500px]">
        {/* Left Side - Text */}
        <div className="flex flex-col gap-4 md:gap-6 items-center lg:items-start text-center lg:text-left">
          <h1 className="font-poppins font-semibold text-3xl sm:text-4xl md:text-5xl text-[#111827] leading-tight whitespace-normal sm:whitespace-nowrap">
            <span className="block">The seamless transition</span>
            <span className="block">from classroom to career</span>
          </h1>

          <p className="font-inter text-base sm:text-lg md:text-xl text-[#6b7280] leading-relaxed">
            Unify your notes, studying, tasks, and career prep in one
            <br className="hidden sm:block" />
            platform. No app switching, just seamless progress.
          </p>

          <Link
            to="/register"
            className="bg-[#6b21a8] opacity-90 hover:opacity-100 text-white font-inter font-bold text-base md:text-lg px-6 md:px-8 py-2.5 md:py-3 rounded-full inline-block w-fit transition-opacity"
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
      <section className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 md:px-10 py-2 gap-4 sm:gap-0">
        <p className="font-poppins text-base sm:text-lg md:text-xl lg:text-2xl text-black text-center sm:text-left">
          Featured in 2026 Technical Entrepreneurship Incubator
        </p>

        <div className="flex items-center gap-4 sm:gap-6">
          <img
            src={allStarCodeLogo}
            alt="All Star Code"
            className="h-10 sm:h-12 md:h-14 object-contain"
          />
          <img
            src={googlePlayLogo}
            alt="Google Play"
            className="h-8 sm:h-10 md:h-12 object-contain"
          />
        </div>
      </section>

      {/* Features Headline */}
      <section
        id="product"
        className="flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 md:px-12 py-4 gap-6 md:gap-8 md:pl-16 lg:pl-20"
      >
        <div className="bg-[#6b21a8] rounded-xl px-5 sm:px-6 py-3 sm:py-4 w-52 sm:w-64 md:w-72 shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="font-inter font-bold text-2xl sm:text-3xl md:text-4xl text-white text-center">
            Features
          </h2>
        </div>

        <p className="font-inter text-sm sm:text-base md:text-lg lg:text-xl text-black max-w-2xl leading-relaxed text-center md:text-left">
          Our features allow you to import notes from Google Docs, generate
          AI-powered flashcards, manage tasks with integrated calendars,
          collaborate with friends, and track your entire career journey.
          Everything you need flows seamlessly in one intelligent platform.
        </p>
      </section>

      {/* Features Grid */}
      <section className="flex flex-col gap-4 sm:gap-6 px-4 sm:px-6">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 px-0 sm:px-4 md:px-6">
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
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8 px-0 sm:px-4 md:px-6">
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

// Hero Image Component - uses CSS scale to maintain ratios
function HeroImage({ womanImg, calendarImg, briefcaseImg, googleDocsImg, indexCardImg }) {
  return (
    <div className="relative w-[280px] h-[245px] sm:w-[360px] sm:h-[315px] md:w-[420px] md:h-[367px] lg:w-[480px] lg:h-[420px] shrink-0">
      {/* Jane Doe Card */}
      <div className="absolute -top-1 sm:-top-2 right-0 bg-[#EDE9FE] text-[#6b21a8] rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 shadow-lg min-w-[160px] sm:min-w-[210px] md:min-w-[245px] lg:min-w-[280px] z-10">
        <h3 className="font-dm font-medium text-lg sm:text-xl md:text-2xl lg:text-3xl mb-0.5 sm:mb-1">Jane Doe</h3>
        <p className="font-work text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Sophomore at Lehigh University</p>
        <p className="font-work text-[10px] sm:text-xs md:text-sm whitespace-nowrap">Business Information Systems Major</p>
      </div>

      {/* Woman Student - positioned so bottom touches calendar top-left */}
      <img
        src={womanImg}
        alt="Student illustration"
        className="absolute top-0 -left-3 sm:-left-4 md:-left-5 lg:-left-6 w-[75px] h-[75px] sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain z-20"
      />

      {/* Calendar SVG - main central element */}
      <img
        src={calendarImg}
        alt="Calendar"
        className="absolute top-12 sm:top-14 md:top-[70px] lg:top-20 left-7 sm:left-9 md:left-10 lg:left-12 w-[175px] h-[158px] sm:w-[225px] sm:h-[202px] md:w-[262px] md:h-[236px] lg:w-[300px] lg:h-[270px]"
      />

      {/* Briefcase - overlapping right edge of calendar */}
      <img
        src={briefcaseImg}
        alt="Briefcase"
        className="absolute top-[102px] sm:top-32 md:top-[154px] lg:top-44 right-12 sm:right-14 md:right-[70px] lg:right-20 w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain z-10"
      />

      {/* Google Docs - touching bottom edge of calendar, slightly lower */}
      <img
        src={googleDocsImg}
        alt="Google Docs"
        className="absolute -bottom-2 sm:-bottom-3 md:-bottom-3.5 lg:-bottom-4 left-[75px] sm:left-24 md:left-28 lg:left-32 w-8 h-12 sm:w-10 sm:h-[60px] md:w-12 md:h-[70px] lg:w-14 lg:h-20 object-contain z-10"
      />

      {/* Index Card / Flashcard - bottom right, overlapping calendar corner */}
      <img
        src={indexCardImg}
        alt="Flashcard"
        className="absolute bottom-5 sm:bottom-6 md:bottom-7 lg:bottom-8 right-7 sm:right-9 md:right-10 lg:right-12 w-[75px] h-14 sm:w-24 sm:h-[72px] md:w-28 md:h-[84px] lg:w-32 lg:h-24 object-contain z-10"
      />
    </div>
  );
}

// Feature Card Component
function FeatureCard({ title, description }) {
  return (
    <div className="flex-1 bg-[#ede9fe] px-5 sm:px-6 md:px-8 py-5 sm:py-6 md:py-7 shadow-md rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-[#e4d4fc] cursor-pointer">
      <h3 className="font-dm font-medium text-xl sm:text-2xl md:text-3xl text-black mb-2 sm:mb-2.5 md:mb-3">{title}</h3>
      <p className="font-work text-xs sm:text-sm text-black leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export default Landing;
