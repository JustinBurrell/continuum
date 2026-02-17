import React from 'react';
import { FaLinkedin, FaGithub, FaReact } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between font-inter text-xs sm:text-sm text-black py-2 sm:py-3 border-t border-gray-200 gap-2 sm:gap-0">
      {/* Social Icons - Left */}
      <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 md:px-8">
        <a
          href="https://www.linkedin.com/in/thejustinburrell/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#6b21a8] transition-colors"
          aria-label="LinkedIn"
        >
          <FaLinkedin className="w-4 h-4 sm:w-5 sm:h-5" />
        </a>
        <a
          href="https://github.com/JustinBurrell"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#6b21a8] transition-colors"
          aria-label="GitHub"
        >
          <FaGithub className="w-4 h-4 sm:w-5 sm:h-5" />
        </a>
        <a
          href="mailto:justinburrell715@gmail.com"
          className="hover:text-[#6b21a8] transition-colors"
          aria-label="Email"
        >
          <MdEmail className="w-4 h-4 sm:w-5 sm:h-5" />
        </a>
      </div>

      {/* Built in React - Center */}
      <div className="flex items-center gap-1.5 order-first sm:order-none">
        <span>Built in React</span>
        <FaReact className="w-4 h-4 sm:w-5 sm:h-5 text-[#61dafb] animate-spin-slow" />
      </div>

      {/* Copyright - Right */}
      <div className="flex items-center px-4 sm:px-6 md:px-8">
        <span>© Continuum 2026</span>
      </div>
    </footer>
  );
}

export default Footer;
