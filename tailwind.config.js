/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#308ce8",
        "primary-content": "#ffffff",
        "primary-light": "#eaf4fe",
        "background-light": "#f6f7f8",
        "background-dark": "#111921",
        "surface-light": "#ffffff",
        "surface-dark": "#1a242d",
        "text-main": "#1e293b",
        "text-sub": "#64748b",
        mint: {
          50: "#f0fdf9",
          100: "#ccfbf1",
          200: "#99f6e4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        orange: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#f97316",
          600: "#ea580c",
        },
        calm: {
          blue: "#E3F2FD",
        },
        focus: {
          dark: "#263238",
        },
        exam: {
          orange: "#FFF3E0",
        },
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
}
