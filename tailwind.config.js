/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Design tokens — a "registrar's chalkboard" palette, chosen to
        // fit a university scheduling tool rather than a generic SaaS look.
        board: "#1F3A2E", // deep chalkboard green — primary surface/brand
        "board-dark": "#152A21",
        chalk: "#F6F3E9", // chalk-dust off-white — light surface
        ink: "#10241C", // near-black green — body text on light surfaces
        amber: "#E4A339", // chalk-yellow accent — primary actions
        "amber-dark": "#C7862083",
        slate: "#52655C", // muted secondary text
        rule: "#D8D2BE", // hairline rule/grid lines on chalk surfaces
        "rule-dark": "#33493E", // hairline rule lines on board surfaces
        danger: "#B8453B",
        success: "#3F7A54",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(var(--tw-grid-line-color, rgba(255,255,255,0.06)) 1px, transparent 1px), linear-gradient(90deg, var(--tw-grid-line-color, rgba(255,255,255,0.06)) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
