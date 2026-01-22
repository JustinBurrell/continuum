import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const continuumText = '/assets/images/continuum-text.png';

function Login() {
  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col gap-2 md:gap-3 lg:gap-4 px-2 sm:px-4 md:px-6 py-2">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center lg:items-center justify-center gap-8 lg:gap-16 flex-1">
        {/* Left Side - Branding */}
        <div className="flex flex-col gap-2 items-start text-left">
          {/* Continuum Wordmark Image */}
          <img
            src={continuumText}
            alt="Continuum"
            className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto object-contain -ml-6"
          />

          <h2 className="font-poppins font-semibold text-lg sm:text-xl md:text-2xl text-[#111827] leading-tight max-w-md">
            The seamless transition from classroom to career.
          </h2>
        </div>

        {/* Right Side - Login Form */}
        <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
          <form className="flex flex-col gap-4">
            {/* Email Field - placeholder inside */}
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-4 border border-[#dddfe2] rounded-md font-inter text-lg text-[#1e1e1e] placeholder-[#90949c] focus:outline-none focus:border-[#6b21a8] transition-colors"
            />

            {/* Password Field - placeholder inside */}
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-4 border border-[#dddfe2] rounded-md font-inter text-lg text-[#1e1e1e] placeholder-[#90949c] focus:outline-none focus:border-[#6b21a8] transition-colors"
            />

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-[#6b21a8] text-white font-inter font-bold text-xl py-3 rounded-md hover:bg-[#581c87] transition-colors"
            >
              Log In
            </button>

            {/* Divider */}
            <div className="border-t border-[#dadde1] my-2"></div>

            {/* Create Account Button - green */}
            <div className="flex justify-center">
              <Link
                to="/register"
                className="bg-[#42b72a] text-white font-inter font-bold text-lg px-6 py-3 rounded-md hover:bg-[#36a420] transition-colors"
              >
                Create new account
              </Link>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Login;
