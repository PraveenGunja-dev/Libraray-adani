/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef6ff',
          100: '#d9ecff',
          500: '#1e78d7',
          700: '#0c4f93',
          900: '#08243f',
          950: '#06192e',
        },
        corporate: {
          sky: '#79c8ff',
          mint: '#48caa8',
          ink: '#102033',
          line: '#e7edf5',
          bg: '#f5f8fc',
        },
      },
      boxShadow: {
        card: '0 18px 45px rgba(16, 32, 51, 0.08)',
        soft: '0 10px 28px rgba(8, 36, 63, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
