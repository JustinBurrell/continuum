/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          primary: '#6b21a8',
          light: '#ede9fe',
        },
        gray: {
          bg: '#f8f9fa',
          text: '#6b7280',
          dark: '#111827',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
        work: ['Work Sans', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
};
