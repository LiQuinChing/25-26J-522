/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#17b0cf",
        "primary-dark": "#0e8fa8",
        "secondary": "#B2EBF2",
        "background-light": "#B2EBF2",
        "surface-light": "#ffffff",
        "text-primary": "#0e191b",
        "text-secondary": "#4e8b97",
        "accent-blue": "#0e5e6f",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "full": "9999px"
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
