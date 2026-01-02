/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#feccaa',
          300: '#fdab75',
          400: '#fb8439',
          500: '#ff6b35',
          600: '#ed4f11',
          700: '#c53d0b',
          800: '#9d3311',
          900: '#7f2e11',
        },
        secondary: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#e8d5d0',
          300: '#d8b9b0',
          400: '#c79787',
          500: '#b97b6b',
          600: '#a5615a',
          700: '#8c4f4a',
          800: '#734340',
          900: '#5f3937',
        },
      },
    },
  },
  plugins: [],
};
