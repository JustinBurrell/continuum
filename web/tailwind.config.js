/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map CSS vars to Tailwind tokens
        background: 'var(--bg)',
        foreground: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        border: 'var(--border)',
        card: {
          DEFAULT: 'var(--bg-card)',
          foreground: 'var(--text-primary)',
        },
        sidebar: 'var(--bg-sidebar)',
        accent: 'var(--bg-hover)',
        primary: {
          DEFAULT: 'var(--primary)',
          bg: 'var(--primary-bg)',
          hover: 'var(--primary-hover)',
          foreground: 'var(--primary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          bg: 'var(--destructive-bg)',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
        },
        muted: {
          DEFAULT: 'var(--bg-hover)',
          foreground: 'var(--text-secondary)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        marketing: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        dropdown: 'var(--shadow-dropdown)',
      },
      fontSize: {
        '2xs': ['10px', '1.4'],
      },
    },
  },
  plugins: [],
};
