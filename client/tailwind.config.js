/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#13daec',
        'primary-dark': '#0ea5b5',
        'teal-bg': '#B2EBF2',
        'background-light': '#f6f8f8',
        'background-dark': '#102022',
      },
      fontFamily: {
        display: ['Lexend', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
