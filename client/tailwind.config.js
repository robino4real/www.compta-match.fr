/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a',
        accent: '#f97316'
      }
    }
  },
  plugins: []
};
