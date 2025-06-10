/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yellow: {
          50: '#fefce8',
          100: '#fef9c2',
          200: '#fff085',
          300: '#ffdf20',
          400: '#ffc700',
          500: '#fdb900',
          600: '#ff8f00',
          700: '#ff8f00',
          800: '#d08700',
          900: '#a65f00',
        },
      },
      animation: {
        'spin': 'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};