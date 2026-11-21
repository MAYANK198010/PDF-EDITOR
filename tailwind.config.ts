import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: { colors: { ink: "#17211d", muted: "#68746f", mint: "#d9f4e8", brand: "#16845b" }, boxShadow: { soft: "0 12px 40px rgba(28,55,43,.08)" } } },
  plugins: []
};
export default config;