// frontend/tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // UPDATED Custom Color Palette to match SNS Website
      colors: {
        'sns-primary': '#990000', // Deep Red/Maroon
        'sns-accent': '#FFC400',  // Vibrant Yellow/Orange (from buttons)
        'sns-light': '#fefefe',    // Near-white for clean sections
        'sns-dark': '#333333',     // Dark text color
      },
      
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}