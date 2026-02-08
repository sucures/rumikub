/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rummikub: {
          red: '#EF4444',
          blue: '#3B82F6',
          yellow: '#FBBF24',
          black: '#1F2937',
        },
        board: {
          green: '#059669',
          dark: '#064E3B',
        }
      },
      fontFamily: {
        game: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
