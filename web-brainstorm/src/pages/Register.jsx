import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const continuumText = '/assets/images/continuum-text.png';

function Register() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-purple-200/40 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-violet-100/30 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-100/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-[#f8f9fa] border-b border-purple-100/30 px-4 sm:px-6 md:px-10 py-2">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-center gap-12 lg:gap-20 w-full max-w-5xl">

          {/* Left Side - Branding & Benefits */}
          <div className="flex flex-col gap-6 items-center lg:items-start text-center lg:text-left max-w-md opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.1s_forwards]">
            <img
              src={continuumText}
              alt="Continuum"
              className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain lg:-ml-2"
            />
            <p className="font-inter text-lg sm:text-xl text-[#4b5563] leading-relaxed">
              Join thousands of students transforming their
              <span className="text-[#6b21a8] font-semibold"> academic journey</span>.
            </p>

            {/* Benefits List */}
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ede9fe] to-[#f3e8ff] rounded-xl flex items-center justify-center text-[#6b21a8] flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-inter text-[#374151]">Smart notes with AI-powered insights</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ede9fe] to-[#f3e8ff] rounded-xl flex items-center justify-center text-[#6b21a8] flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-inter text-[#374151]">Unified calendar for all your tasks</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ede9fe] to-[#f3e8ff] rounded-xl flex items-center justify-center text-[#6b21a8] flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="font-inter text-[#374151]">Career tools to land your dream job</span>
              </div>
            </div>
          </div>

          {/* Right Side - Register Card */}
          <div className="w-full max-w-md opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.3s_forwards]">
            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-purple-100/50 overflow-hidden">
              {/* Decorative gradient corners */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#6b21a8]/5 via-transparent to-transparent rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#a855f7]/5 via-transparent to-transparent rounded-tr-full" />

              <div className="relative z-10">
                <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-[#111827] mb-2">
                  Create your account
                </h1>
                <p className="font-inter text-[#6b7280] mb-8">
                  Start your journey in seconds
                </p>

                <form className="flex flex-col gap-5">
                  {/* First Name Field */}
                  <div className="group">
                    <label className="block font-inter text-sm font-medium text-[#374151] mb-2 text-left">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your first name"
                      className="w-full px-4 py-3.5 bg-[#f8f9fa] border-2 border-transparent rounded-xl font-inter text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#6b21a8] focus:bg-white transition-all duration-200"
                    />
                  </div>

                  {/* Last Name Field */}
                  <div className="group">
                    <label className="block font-inter text-sm font-medium text-[#374151] mb-2 text-left">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your last name"
                      className="w-full px-4 py-3.5 bg-[#f8f9fa] border-2 border-transparent rounded-xl font-inter text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#6b21a8] focus:bg-white transition-all duration-200"
                    />
                  </div>

                  {/* Google Sign Up Button */}
                  <button
                    type="button"
                    className="group relative w-full flex items-center justify-center gap-3 bg-[#6b21a8] text-white font-inter font-semibold text-lg py-4 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(107,33,168,0.5)] hover:-translate-y-0.5 mt-2"
                  >
                    <svg className="w-5 h-5 relative z-10" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="relative z-10">Continue with Google</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#6b21a8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>

                  {/* Terms */}
                  <p className="font-inter text-xs text-[#9ca3af] text-center mt-2 leading-relaxed">
                    By signing up, you agree to our{' '}
                    <a href="#" className="text-[#6b21a8] hover:underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-[#6b21a8] hover:underline">Privacy Policy</a>
                  </p>
                </form>

                {/* Sign In Link */}
                <div className="mt-8 pt-6 border-t border-[#f3f4f6] text-center">
                  <p className="font-inter text-[#6b7280]">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-[#6b21a8] hover:text-[#581c87] transition-colors"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="relative z-10 px-4 sm:px-6 md:px-10">
        <Footer />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Register;
