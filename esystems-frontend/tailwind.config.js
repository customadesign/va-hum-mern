/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0e6ff',
          100: '#d9c2ff',
          200: '#b899ff',
          300: '#9770ff',
          400: '#5a2ddb',
          500: '#3d1c99',
          600: '#09006e',
          700: '#09006e',
          800: '#06004d',
          900: '#040033',
        },
        accent: {
          50: '#fff9e6',
          100: '#ffeecc',
          200: '#ffdd99',
          300: '#ffcc66',
          400: '#ffbb33',
          500: '#ef8f00',
          600: '#ef8f00',
          700: '#cc7a00',
          800: '#995c00',
          900: '#663d00',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}