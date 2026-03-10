/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef7ed',
          100: '#fdedd3',
          200: '#fad6a5',
          300: '#f7b96d',
          400: '#f39333',
          500: '#f0760e',
          600: '#e15c09',
          700: '#bb430a',
          800: '#953510',
          900: '#792e10',
        },
        surface: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a27',
          600: '#232334',
          500: '#2d2d42',
        },
      },
    },
  },
  plugins: [],
}
