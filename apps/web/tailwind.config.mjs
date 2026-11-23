/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ecosystem accent colors per AGENTS.md
        primary: {
          DEFAULT: '#2563EB',   // Blue 600 (Productivity - light)
          dark: '#60A5FA',      // Blue 400 (Productivity - dark)
        },
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2DD4BF',       // Utilities - dark accent
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0F766E',       // Utilities - light accent
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#FBBF24',       // Time & Math - dark accent
          500: '#f59e0b',
          600: '#d97706',
          700: '#B45309',       // Time & Math - light accent
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        zinc: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px 0 rgba(37,99,235,0.3)' },
          '50%':      { boxShadow: '0 0 40px 8px rgba(37,99,235,0.5)' },
        },
      },
      animation: {
        'fade-up':      'fade-up 0.6s ease-out forwards',
        'fade-in':      'fade-in 0.4s ease-out forwards',
        'gradient-x':   'gradient-x 8s ease infinite',
        'float':        'float 3s ease-in-out infinite',
        'pulse-glow':   'pulse-glow 2s ease-in-out infinite',
      },
      backgroundSize: {
        '200%': '200%',
      },
    },
  },
  plugins: [],
}
