/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../../apps/**/*.{js,jsx,ts,tsx,astro,html}",
    "../../packages/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: 'var(--color-accent-light, #2563eb)',
          dark: 'var(--color-accent-dark, #60A5FA)',
          DEFAULT: 'var(--color-accent-light, #2563eb)',
        },
      },
    },
  },
  plugins: [],
}
