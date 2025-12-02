/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        clinic: {
          pink: '#ec4899',
          'pink-dark': '#db2777',
          beige: '#e5c8a6',
          ink: '#3b0764',
        },
      },
    },
  },
  plugins: [],
}
