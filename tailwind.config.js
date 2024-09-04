/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./layouts/**/*.html",
    "./content/**/*.md",
    "./themes/**/*.{html,js}",  // If you are using a theme
    "./assets/**/*.js",         // If you have JavaScript files in assets
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

