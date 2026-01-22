import React from 'react';
import { Link } from 'react-router-dom';

const continuumLogo = '/assets/images/continuum-full-logo.png';

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-[#f8f9fa] flex items-center justify-between w-full h-14 sm:h-16">
      {/* Logo */}
      <Link to="/" className="flex items-center">
        <img
          src={continuumLogo}
          alt="Continuum"
          className="h-28 sm:h-36 md:h-40 lg:h-48 w-auto object-contain"
        />
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-4 sm:gap-6 md:gap-10 lg:gap-14 text-xs sm:text-xs md:text-sm lg:text-base text-black font-inter">
        <a href="#product" className="hover:text-[#6b21a8] transition-colors">
          Product
        </a>
        <a href="#about" className="hover:text-[#6b21a8] transition-colors hidden sm:block">
          About
        </a>
        <Link to="/login" className="hover:text-[#6b21a8] transition-colors">
          Log In
        </Link>
        <Link
          to="/register"
          className="hover:text-[#6b21a8] transition-colors"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
