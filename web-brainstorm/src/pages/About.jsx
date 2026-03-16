import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Image assets
const allStarCodeLogo = '/assets/images/allstarcode-logo.png';
const googlePlayLogo = '/assets/images/google-play-logo.png';

function About() {
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
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-purple-200/40 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-100/30 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-[#f8f9fa] border-b border-purple-100/30 px-4 sm:px-6 md:px-10 py-2">
        <Navbar />
      </div>

      <div className="relative z-10 flex flex-col px-4 sm:px-6 md:px-10">

        {/* Hero Section */}
        <section className="py-16 md:py-24 lg:py-32 text-center max-w-4xl mx-auto">
          <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4 opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.1s_forwards]">
            About
          </span>
          <h1 className="font-poppins font-bold text-4xl sm:text-5xl md:text-6xl text-[#111827] leading-[1.1] tracking-tight mb-6 opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.2s_forwards]">
            The story behind{' '}
            <span className="bg-gradient-to-r from-[#6b21a8] via-[#7c3aed] to-[#a855f7] bg-clip-text text-transparent">
              Continuum
            </span>
          </h1>
          <p className="font-inter text-lg sm:text-xl md:text-2xl text-[#4b5563] leading-relaxed max-w-3xl mx-auto opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.4s_forwards]">
            Born from the 2026 Technical Entrepreneurship Incubator, Continuum is a passion project designed to solve the fragmentation every student faces.
          </p>
        </section>

        {/* Technical Entrepreneurship Incubator Section */}
        <section className="py-16 md:py-20">
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 max-w-5xl mx-auto">
            <div className="relative bg-white rounded-3xl p-8 md:p-12 border border-purple-100/50 overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#6b21a8]/5 to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-100/50 to-transparent rounded-tr-full" />

              <div className="relative z-10">
                <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4">
                  The Program
                </span>
                <h2 className="font-poppins font-bold text-2xl sm:text-3xl md:text-4xl text-[#111827] leading-tight mb-6">
                  Technical Entrepreneurship Incubator
                </h2>
                <p className="font-inter text-lg text-[#4b5563] leading-relaxed mb-6">
                  The Technical Entrepreneurship Incubator (TEI) is an intensive 8-week program that brings together aspiring entrepreneurs and developers to build real-world solutions. Participants work on their own projects while receiving mentorship, technical guidance, and resources to transform ideas into working products.
                </p>
                <p className="font-inter text-lg text-[#4b5563] leading-relaxed mb-6">
                  The 2026 cohort, running from February 16 to April 10, challenges participants to identify genuine problems, design thoughtful solutions, and ship production-ready software—all within a tight timeline that mirrors startup reality.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-[#f8f9fa] rounded-xl px-4 py-2">
                    <span className="font-inter text-sm text-[#6b7280]">Duration:</span>
                    <span className="font-inter font-semibold text-[#111827] ml-2">8 Weeks</span>
                  </div>
                  <div className="bg-[#f8f9fa] rounded-xl px-4 py-2">
                    <span className="font-inter text-sm text-[#6b7280]">Focus:</span>
                    <span className="font-inter font-semibold text-[#111827] ml-2">Full-Stack Development</span>
                  </div>
                  <div className="bg-[#f8f9fa] rounded-xl px-4 py-2">
                    <span className="font-inter text-sm text-[#6b7280]">Outcome:</span>
                    <span className="font-inter font-semibold text-[#111827] ml-2">Production-Ready MVP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Inspiration Section */}
        <section className="py-16 md:py-20">
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4">
                The Why
              </span>
              <h2 className="font-poppins font-bold text-2xl sm:text-3xl md:text-4xl text-[#111827] leading-tight">
                Why I built Continuum
              </h2>
            </div>

            <div className="relative bg-gradient-to-br from-[#6b21a8] via-[#7c3aed] to-[#a855f7] rounded-3xl p-8 md:p-12 overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-60 h-60 border border-white rounded-full translate-x-1/3 translate-y-1/3" />
                <div className="absolute top-1/2 left-1/2 w-80 h-80 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
              </div>

              <div className="relative z-10 space-y-6">
                <p className="font-inter text-lg md:text-xl text-white leading-relaxed">
                  As a student, I found myself constantly switching between Google Docs for notes, Quizlet for studying, a calendar app for deadlines, Excel for tracking job applications, and multiple group chats for coordination. Every day felt like a battle against my own tools rather than a smooth learning experience.
                </p>
                <p className="font-inter text-lg md:text-xl text-white leading-relaxed">
                  I realized that these weren't separate problems—they were symptoms of a fragmented system. What if everything could flow naturally from taking notes to studying to completing tasks to landing a job? What if the tools got out of the way and let students focus on what actually matters?
                </p>
                <p className="font-inter text-lg md:text-xl text-white leading-relaxed">
                  Continuum is my answer to that question. It's the platform I wish I had when I started college—one that understands the continuous journey from classroom to career and supports every step along the way.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section className="py-16 md:py-20">
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 text-center mb-12">
            <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4">
              Our Partners
            </span>
            <h2 className="font-poppins font-bold text-2xl sm:text-3xl md:text-4xl text-[#111827] leading-tight">
              Supported by industry leaders
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* All Star Code */}
            <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 bg-white rounded-2xl p-8 border border-purple-100/50 hover:shadow-xl transition-shadow duration-300">
              <div className="flex justify-center mb-6">
                <img
                  src={allStarCodeLogo}
                  alt="All Star Code"
                  className="h-20 md:h-24 object-contain"
                />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-[#111827] mb-3">
                All Star Code
              </h3>
              <p className="font-inter text-[#6b7280] leading-relaxed mb-4">
                All Star Code is a nonprofit organization that creates economic opportunity by developing a diverse pipeline of talent for the tech industry. Through their Summer Intensive program, they've trained thousands of young men of color in computer science and entrepreneurship.
              </p>
              <p className="font-inter text-[#6b7280] leading-relaxed">
                Their alumni network continues to support each other through programs like the Technical Entrepreneurship Incubator, fostering a community of builders and innovators.
              </p>
              <a
                href="https://allstarcode.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-inter font-semibold text-[#6b21a8] mt-4 hover:underline"
              >
                Learn more
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Google Play */}
            <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 bg-white rounded-2xl p-8 border border-purple-100/50 hover:shadow-xl transition-shadow duration-300" style={{ transitionDelay: '100ms' }}>
              <div className="flex justify-center mb-6">
                <img
                  src={googlePlayLogo}
                  alt="Google Play"
                  className="h-20 md:h-24 object-contain"
                />
              </div>
              <h3 className="font-poppins font-semibold text-xl text-[#111827] mb-3">
                Google Play
              </h3>
              <p className="font-inter text-[#6b7280] leading-relaxed mb-4">
                Google Play serves as our distribution platform, making Continuum accessible to millions of Android users worldwide. Their developer ecosystem provides the tools and reach necessary to bring educational technology to students everywhere.
              </p>
              <p className="font-inter text-[#6b7280] leading-relaxed">
                Through Google's APIs—including Google Docs and Google Drive integration—Continuum seamlessly connects with the tools students already use, making the transition to a unified workflow effortless.
              </p>
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-inter font-semibold text-[#6b21a8] mt-4 hover:underline"
              >
                View on Play Store
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* About Me Section */}
        <section className="py-16 md:py-24">
          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 text-center mb-12">
            <span className="inline-block font-inter text-sm font-semibold text-[#6b21a8] tracking-widest uppercase mb-4">
              The Creator
            </span>
            <h2 className="font-poppins font-bold text-2xl sm:text-3xl md:text-4xl text-[#111827] leading-tight">
              Meet the Developer
            </h2>
          </div>

          <div className="scroll-animate opacity-0 translate-y-8 transition-all duration-700 max-w-4xl mx-auto">
            <div className="relative bg-white rounded-3xl p-8 md:p-12 border border-purple-100/50 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#6b21a8]/5 to-transparent rounded-bl-full" />

              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Profile Image Placeholder */}
                <div className="flex-shrink-0">
                  <div className="w-40 h-40 md:w-48 md:h-48 bg-gradient-to-br from-[#ede9fe] to-[#f3e8ff] rounded-2xl flex items-center justify-center border-2 border-dashed border-purple-200">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-[#6b21a8]/40 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-inter text-xs text-[#6b21a8]/60">Photo</span>
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-poppins font-bold text-2xl md:text-3xl text-[#111827] mb-2">
                    Justin Burrell
                  </h3>
                  <p className="font-inter text-[#6b21a8] font-medium mb-4">
                    Full-Stack Developer & Creator of Continuum
                  </p>

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                      <span className="font-inter text-[#6b7280]">Lehigh University</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#6b7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-inter text-[#6b7280]">Computer Science and Engineering</span>
                    </div>
                  </div>

                  <p className="font-inter text-[#4b5563] leading-relaxed mb-6">
                    A passionate developer focused on building tools that make a real difference in people's lives. When not coding, you can find me exploring new technologies, contributing to open source, and mentoring aspiring developers.
                  </p>

                  {/* Social Links */}
                  <div className="flex gap-4 justify-center md:justify-start">
                    {/* LinkedIn */}
                    <a
                      href="https://www.linkedin.com/in/thejustinburrell/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-[#f8f9fa] rounded-xl flex items-center justify-center text-[#6b7280] hover:bg-[#6b21a8] hover:text-white transition-all duration-300"
                      aria-label="LinkedIn"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>

                    {/* GitHub */}
                    <a
                      href="https://github.com/JustinBurrell"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-[#f8f9fa] rounded-xl flex items-center justify-center text-[#6b7280] hover:bg-[#6b21a8] hover:text-white transition-all duration-300"
                      aria-label="GitHub Repository"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </a>

                    {/* Email */}
                    <a
                      href="justinburrell715@gmail.com"
                      className="w-12 h-12 bg-[#f8f9fa] rounded-xl flex items-center justify-center text-[#6b7280] hover:bg-[#6b21a8] hover:text-white transition-all duration-300"
                      aria-label="Email"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>

                    {/* Resume */}
                    <a
                      href="/resume.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-[#f8f9fa] rounded-xl flex items-center justify-center text-[#6b7280] hover:bg-[#6b21a8] hover:text-white transition-all duration-300"
                      aria-label="Resume"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
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

export default About;
