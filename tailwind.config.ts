import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10212B",
        slate: "#50656F",
        mist: "#EEF3F1",
        line: "#D6E2DE",
        accent: "#156B52",
        sand: "#F7F5EE",
        warn: "#B86A1F"
      },
      boxShadow: {
        panel: "0 10px 40px rgba(16, 33, 43, 0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      fontFamily: {
        sans: ["Avenir Next", "Segoe UI", "Helvetica Neue", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
