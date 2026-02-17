import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const continuumText = '/assets/images/continuum-text.png';

function Login() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col">
      {/* Ambient background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-200/30 via-transparent to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-violet-100/40 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <div className="sticky top-0 z-50 bg-[#f8f9fa] border-b border-purple-100/30 px-4 sm:px-6 md:px-10 py-2">
        <Navbar />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-center gap-12 lg:gap-20 w-full max-w-5xl">

          {/* Left Side - Branding */}
          <div className="flex flex-col gap-4 items-center lg:items-start text-center lg:text-left opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.1s_forwards]">
            <img
              src={continuumText}
              alt="Continuum"
              className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto object-contain lg:-ml-2"
            />
            <p className="font-inter text-lg sm:text-xl md:text-2xl text-[#4b5563] leading-relaxed max-w-md">
              The seamless transition from
              <span className="text-[#6b21a8] font-semibold"> classroom </span>
              to
              <span className="text-[#6b21a8] font-semibold"> career</span>.
            </p>
          </div>

          {/* Right Side - Login Card */}
          <div className="w-full max-w-md opacity-0 animate-[fadeSlideUp_0.8s_ease-out_0.3s_forwards]">
            <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-purple-100/50 overflow-hidden">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#6b21a8]/5 to-transparent rounded-bl-full" />

              <div className="relative z-10">
                <h1 className="font-poppins font-bold text-2xl sm:text-3xl text-[#111827] mb-2">
                  Welcome back
                </h1>
                <p className="font-inter text-[#6b7280] mb-8">
                  Sign in to continue your journey
                </p>

                <form className="flex flex-col gap-5">
                  {/* Email Field */}
                  <div className="group">
                    <label className="block font-inter text-sm font-medium text-[#374151] mb-2 text-left">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3.5 bg-[#f8f9fa] border-2 border-transparent rounded-xl font-inter text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#6b21a8] focus:bg-white transition-all duration-200"
                    />
                  </div>

                  {/* Password Field */}
                  <div className="group">
                    <label className="block font-inter text-sm font-medium text-[#374151] mb-2 text-left">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      className="w-full px-4 py-3.5 bg-[#f8f9fa] border-2 border-transparent rounded-xl font-inter text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#6b21a8] focus:bg-white transition-all duration-200"
                    />
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    className="group relative w-full bg-[#6b21a8] text-white font-inter font-semibold text-lg py-4 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_10px_30px_-10px_rgba(107,33,168,0.5)] hover:-translate-y-0.5 mt-2"
                  >
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#6b21a8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-4 my-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent" />
                    <span className="font-inter text-sm text-[#9ca3af]">or</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#e5e7eb] to-transparent" />
                  </div>

                  {/* Google Sign In */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#e5e7eb] text-[#374151] font-inter font-medium text-base py-3.5 rounded-xl transition-all duration-200 hover:border-[#6b21a8]/30 hover:shadow-md"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="mt-8 pt-6 border-t border-[#f3f4f6] text-center">
                  <p className="font-inter text-[#6b7280]">
                    Don't have an account?{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-[#6b21a8] hover:text-[#581c87] transition-colors"
                    >
                      Sign up for free
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

export default Login;
