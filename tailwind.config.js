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
        'float': 'float 6s linear infinite',
        'fadeSlideIn': 'fadeSlideIn 0.35s cubic-bezier(0.21, 1, 0.21, 1) both',
        'fadeSlideOut': 'fadeSlideOut 0.25s ease both',
      },
      keyframes: {
        float: {
          '0%': { 
            transform: 'translateY(0) scale(1)', 
            opacity: '0' 
          },
          '8%': { 
            opacity: '0.85' 
          },
          '100%': { 
            transform: 'translateY(-220px) scale(1.15)', 
            opacity: '0' 
          }
        },
        fadeSlideIn: {
          'from': { 
            opacity: '0', 
            transform: 'translate(-50%, calc(-50% + 22px))' 
          },
          'to': { 
            opacity: '1', 
            transform: 'translate(-50%, -50%)' 
          }
        },
        fadeSlideOut: {
          'from': { 
            opacity: '1', 
            transform: 'translate(-50%, -50%)' 
          },
          'to': { 
            opacity: '0', 
            transform: 'translate(-50%, calc(-50% + 16px))' 
          }
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at 30% 30%, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
