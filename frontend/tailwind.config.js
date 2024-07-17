/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true
    },
    extend: {
      colors: {
        'gray-rgba': 'rgba(49, 49, 49, .8)'
      }
    },
  },
  plugins: [],
}

