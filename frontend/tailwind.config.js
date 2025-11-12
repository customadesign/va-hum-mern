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