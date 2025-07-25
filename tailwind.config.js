/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Deep Blue
          light: '#3B82F6',   // Bright Blue
          50: '#eff6ff',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1d4ed8',
        },
        secondary: '#F59E0B',     // Gold Accent
        accent: '#10B981',        // Emerald (Success)
      },
      scale: {
        '98': '0.98',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
