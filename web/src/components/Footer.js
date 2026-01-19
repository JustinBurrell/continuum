import React from 'react';
import { FaLinkedin, FaGithub, FaReact } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between font-inter text-sm sm:text-base md:text-lg lg:text-xl text-black py-4 sm:py-6 border-t border-gray-200 gap-4 sm:gap-0">
      {/* Social Icons - Left */}
      <div className="flex items-center gap-4 sm:gap-6 md:gap-8 px-4 sm:px-8 md:px-12">
        <a
          href="https://www.linkedin.com/in/thejustinburrell/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#6b21a8] transition-colors"
          aria-label="LinkedIn"
        >
          <FaLinkedin className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
        </a>
        <a
          href="https://github.com/JustinBurrell"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#6b21a8] transition-colors"
          aria-label="GitHub"
        >
          <FaGithub className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
        </a>
        <a
          href="mailto:justinburrell715@gmail.com"
          className="hover:text-[#6b21a8] transition-colors"
          aria-label="Email"
        >
          <MdEmail className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
        </a>
      </div>

      {/* Built in React - Center */}
      <div className="flex items-center gap-2 order-first sm:order-none">
        <span>Built in React</span>
        <FaReact className="w-5 h-5 sm:w-6 sm:h-6 text-[#61dafb] animate-spin-slow" />
      </div>

      {/* Copyright - Right */}
      <div className="flex items-center px-4 sm:px-8 md:px-12">
        <span>© Continuum 2026</span>
      </div>
    </footer>
  );
}

export default Footer;
