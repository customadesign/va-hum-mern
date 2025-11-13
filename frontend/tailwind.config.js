/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#76b9f0ff',
          100: '#5baef1ff',
          200: '#3296e9ff',
          300: '#2b90e2ff',
          400: '#2b8bdaff',
          500: '#2984ceff',
          600: '#2173b8',
          700: '#2173b8',
          800: '#1c649eb7',
          900: '#09263df5',
        },
        accent: {
          50: '#d8afafff',
          100: '#dfa0a0ff',
          200: '#da8b8bff',
          300: '#d47a7aff',
          400: '#da6969ff',
          500: '#e45959ff',
          600: '#e44c4cff',
          700: '#ed2524',
          800: '#c92020ff',
          900: '#a71919ff',
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