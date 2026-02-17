import React, { useEffect, useRef } from 'react';
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

// Feature icons as inline SVGs for crisp rendering
const icons = {
  smartNotes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  flashcards: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  social: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  career: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  offline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

function Landing() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    // Add scroll-triggered animations
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
      {/* Ambient background gradient - contained to prevent overflow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-purple-200/40 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-violet-100/30 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Navbar - uses its own sticky positioning */}
      <div className="sticky top-0 z-50 bg-[#f8f9fa] border-b border-purple-100/30 px-4 sm:px-6 md:px-10 py-2">
        <Navbar />
      </div>

      <div className="relative z-10 flex flex-col px-4 sm:px-6 md:px-10">

        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative flex flex-col lg:flex-row items-center lg:items-center justify-between py-16 md:py-24 lg:py-32 gap-12 lg:gap-8"
        >
          {/* Left Side - Text */}
          <div className="flex flex-col gap-6 md:gap-8 items-center lg:items-start text-center lg:text-left max-w-2xl">
            {/* Main Headline */}
            <h1 className="opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.2s_forwards]">
              <span className="block font-poppins font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#111827] leading-[1.1] tracking-tight">
                The seamless
              </span>
              <span className="block font-poppins font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight mt-1">
                <span className="bg-gradient-to-r from-[#6b21a8] via-[#7c3aed] to-[#a855f7] bg-clip-text text-transparent">
                  transition
                </span>
              </span>
              <span className="block font-poppins font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#111827] leading-[1.1] tracking-tight mt-1">
                from classroom
              </span>
              <span className="block font-poppins font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-[#111827] leading-[1.1] tracking-tight mt-1">
                to career
              </span>
            </h1>

            {/* Subheadline */}
            <p className="font-inter text-lg sm:text-xl md:text-2xl text-[#4b5563] leading-relaxed max-w-xl opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.4s_forwards]">
              Unify your notes, studying, tasks, and career prep in one platform.
              <span className="text-[#6b21a8] font-medium"> No app switching</span>, just seamless progress.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.6s_forwards]">
              <Link
                to="/register"
                className="group relative inline-flex items-center justify-center gap-2 bg-[#6b21a8] text-white font-inter font-semibold text-lg px-8 py-4 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(107,33,168,0.4)] hover:-translate-y-0.5"
              >
                <span className="relative z-10">Get Started Free</span>
                <svg className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#6b21a8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              <button className="inline-flex items-center justify-center gap-2 bg-white text-[#6b21a8] font-inter font-semibold text-lg px-8 py-4 rounded-2xl border-2 border-[#6b21a8]/20 transition-all duration-300 hover:border-[#6b21a8] hover:shadow-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Watch Demo
              </button>
            </div>
          </div>

          {/* Right Side - Hero Image */}
          <div className="relative opacity-0 animate-[fadeSlideLeft_1s_ease-out_0.4s_forwards]">
            <HeroImage
              womanImg={womanImg}
              calendarImg={calendarImg}
              briefcaseImg={briefcaseImg}
              googleDocsImg={googleDocsImg}
              indexCardImg={indexCardImg}
            />
          </div>
        </section>

        {/* Social Proof */}
        <section className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 py-8 border-y border-purple-100/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="font-poppins text-lg md:text-xl text-[#374151] text-center md:text-left">
              Featured in <span className="font-semibold">2026 Technical Entrepreneurship Incubator</span>
            </p>
            <div className="flex items-center gap-8">
              <img src={allStarCodeLogo} alt="All Star Code" className="h-12 md:h-14 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
              <img src={googlePlayLogo} alt="Google Play" className="h-10 md:h-12 object-contain grayscale hover:grayscale-0 transition-all duration-300" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="product" ref={featuresRef} className="py-20 md:py-32">
          {/* Section Header */}
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 text-center mb-16 md:mb-24">
            <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4">
              Features
            </span>
            <h2 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-[#111827] leading-tight mb-6">
              Everything you need,
              <br />
              <span className="bg-gradient-to-r from-[#6b21a8] to-[#a855f7] bg-clip-text text-transparent">
                nothing you don't
              </span>
            </h2>
            <p className="font-inter text-lg md:text-xl text-[#6b7280] max-w-2xl mx-auto leading-relaxed">
              From notes to networking, our platform connects every step of your academic and professional journey.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={icons.smartNotes}
              title="Smart Notes"
              description="Import your Google Docs instantly and transform them into organized, searchable notes with AI-powered summaries and highlights."
              delay="0"
            />
            <FeatureCard
              icon={icons.flashcards}
              title="Flashcards"
              description="Generate study-ready flashcards automatically from any note. Study with an interactive flip interface designed for retention."
              delay="100"
            />
            <FeatureCard
              icon={icons.calendar}
              title="Unified Calendar"
              description="Manage tasks, deadlines, and group projects in one view. Create shared tasks that sync across your study group's calendars."
              delay="200"
            />
            <FeatureCard
              icon={icons.social}
              title="Social Learning"
              description="Share notes and flashcards with friends, collaborate on assignments, and stay connected through integrated messaging."
              delay="300"
            />
            <FeatureCard
              icon={icons.career}
              title="Career Hub"
              description="Upload resumes for AI-powered feedback, track applications with networking logs, and manage your entire job search pipeline."
              delay="400"
            />
            <FeatureCard
              icon={icons.offline}
              title="Offline Ready"
              description="Study, take notes, and manage tasks without internet. Everything syncs automatically when you reconnect."
              delay="500"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 py-16 md:py-24">
          <div className="relative bg-gradient-to-br from-[#6b21a8] via-[#7c3aed] to-[#a855f7] rounded-3xl p-6 md:p-10 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-60 h-60 border border-white rounded-full translate-x-1/3 translate-y-1/3" />
              <div className="absolute top-1/2 left-1/2 w-80 h-80 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="relative z-10 text-center">
              <h2 className="font-poppins font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight mb-4">
                Ready to transform your
                <br />
                student journey?
              </h2>
              <p className="font-inter text-base md:text-lg text-white/80 max-w-xl mx-auto mb-6">
                Join thousands of students who are already using Continuum to bridge the gap between learning and career success.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-[#6b21a8] font-inter font-semibold text-base px-8 py-3 rounded-xl transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] hover:-translate-y-0.5"
              >
                Start for Free
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

        @keyframes fadeSlideLeft {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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

// Enhanced Hero Image Component
function HeroImage({ womanImg, calendarImg, briefcaseImg, googleDocsImg, indexCardImg }) {
  return (
    <div className="relative w-[320px] h-[280px] sm:w-[400px] sm:h-[350px] md:w-[480px] md:h-[420px] lg:w-[540px] lg:h-[472px]">
      {/* Decorative rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[90%] h-[90%] border border-purple-200/50 rounded-full animate-[spin_20s_linear_infinite]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[70%] h-[70%] border border-purple-200/30 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
      </div>

      {/* Jane Doe Card */}
      <div className="absolute -top-2 sm:-top-4 right-0 bg-white/90 backdrop-blur-sm text-[#6b21a8] rounded-2xl px-4 sm:px-5 md:px-6 py-3 sm:py-4 shadow-xl border border-purple-100 min-w-[180px] sm:min-w-[220px] md:min-w-[260px] z-10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-[#6b21a8] to-[#a855f7] rounded-full flex items-center justify-center text-white font-bold text-sm">
            JD
          </div>
          <h3 className="font-poppins font-semibold text-lg sm:text-xl md:text-2xl">Jane Doe</h3>
        </div>
        <p className="font-inter text-xs sm:text-sm text-[#6b7280]">Sophomore at Lehigh University</p>
        <p className="font-inter text-xs sm:text-sm text-[#6b7280]">Business Information Systems</p>
      </div>

      {/* Woman Student */}
      <img
        src={womanImg}
        alt="Student illustration"
        className="absolute top-4 -left-2 sm:-left-4 w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px] object-contain z-20 drop-shadow-lg hover:scale-110 transition-transform duration-300"
      />

      {/* Calendar SVG */}
      <img
        src={calendarImg}
        alt="Calendar"
        className="absolute top-16 sm:top-20 md:top-24 left-10 sm:left-12 md:left-14 w-[180px] h-[162px] sm:w-[230px] sm:h-[207px] md:w-[280px] md:h-[252px] lg:w-[320px] lg:h-[288px] drop-shadow-xl"
      />

      {/* Briefcase */}
      <img
        src={briefcaseImg}
        alt="Briefcase"
        className="absolute top-[110px] sm:top-36 md:top-[170px] lg:top-48 right-14 sm:right-16 md:right-20 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-[72px] lg:h-[72px] object-contain z-10 drop-shadow-lg hover:rotate-12 transition-transform duration-300"
      />

      {/* Google Docs */}
      <img
        src={googleDocsImg}
        alt="Google Docs"
        className="absolute -bottom-1 sm:-bottom-2 left-[80px] sm:left-[100px] md:left-[120px] w-9 h-14 sm:w-11 sm:h-[66px] md:w-14 md:h-[84px] object-contain z-10 drop-shadow-lg hover:scale-110 transition-transform duration-300"
      />

      {/* Index Card */}
      <img
        src={indexCardImg}
        alt="Flashcard"
        className="absolute bottom-8 sm:bottom-10 md:bottom-12 right-10 sm:right-12 md:right-14 w-[80px] h-[60px] sm:w-[100px] sm:h-[75px] md:w-[120px] md:h-[90px] lg:w-[140px] lg:h-[105px] object-contain z-10 drop-shadow-lg hover:-rotate-6 transition-transform duration-300"
      />

      {/* Floating dots */}
      <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-[#6b21a8] rounded-full animate-bounce opacity-60" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/3 left-1/4 w-2 h-2 bg-[#a855f7] rounded-full animate-bounce opacity-40" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 right-1/6 w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce opacity-50" style={{ animationDelay: '1s' }} />
    </div>
  );
}

// Enhanced Feature Card Component
function FeatureCard({ icon, title, description, delay }) {
  return (
    <div
      className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 group relative bg-white rounded-2xl p-6 md:p-8 border border-purple-100/50 hover:border-purple-200 hover:shadow-xl hover:-translate-y-2 cursor-pointer"
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6b21a8]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="w-14 h-14 bg-gradient-to-br from-[#ede9fe] to-[#f3e8ff] rounded-xl flex items-center justify-center text-[#6b21a8] mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
          {icon}
        </div>

        {/* Title */}
        <h3 className="font-poppins font-semibold text-xl md:text-2xl text-[#111827] mb-3 group-hover:text-[#6b21a8] transition-colors duration-300">
          {title}
        </h3>

        {/* Description */}
        <p className="font-inter text-sm md:text-base text-[#6b7280] leading-relaxed">
          {description}
        </p>

      </div>
    </div>
  );
}

export default Landing;
