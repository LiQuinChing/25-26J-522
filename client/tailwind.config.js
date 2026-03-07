/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  corePlugins: {
    // Keep existing CRA styles stable while enabling utility classes for the knowledgebase page.
    preflight: false,
  },
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
    },
  },
  plugins: [],
};
