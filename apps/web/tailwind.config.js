/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        background: "#FCFAFD",
        surface: "#FFFFFF",
        secondary: "#F7F3FA",
        border: "#EEE8F4",

        text: "#111827",
        muted: "#6B7280",

        primary: "#18D4D0",
        primaryDark: "#10C4C0",

        success: "#72E33C",
        danger: "#EF4444",
        warning: "#F59E0B",
      },

      borderRadius: {
        xl2: "18px",
      },

      boxShadow: {
        soft:
          "0 1px 3px rgba(15,23,42,.04),0 10px 24px rgba(15,23,42,.06)",
      },
    },
  },

  plugins: [],
};