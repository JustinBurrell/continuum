import React from 'react';
import { FaLinkedin, FaGithub, FaReact } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';

function Footer() {
  return (
    <footer className="flex items-center justify-between font-inter text-xl text-black py-6 border-t border-gray-200">
      {/* Social Icons - Left */}
      <div className="flex items-center gap-8 px-12">
        <a
          href="https://www.linkedin.com/in/thejustinburrell/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#6b21a8] transition-colors"
          aria-label="LinkedIn"
        >
          <FaLinkedin size={28} />
        </a>
        <a
          href="https://github.com/JustinBurrell"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#6b21a8] transition-colors"
          aria-label="GitHub"
        >
          <FaGithub size={28} />
        </a>
        <a
          href="mailto:justinburrell715@gmail.com"
          className="hover:text-[#6b21a8] transition-colors"
          aria-label="Email"
        >
          <MdEmail size={28} />
        </a>
      </div>

      {/* Built in React - Center */}
      <div className="flex items-center gap-2">
        <span>Built in React</span>
        <FaReact size={24} className="text-[#61dafb] animate-spin-slow" />
      </div>

      {/* Copyright - Right */}
      <div className="flex items-center px-12">
        <span>© Continuum 2026</span>
      </div>
    </footer>
  );
}

export default Footer;
