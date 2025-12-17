import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// For GitHub Pages: If your repo is named "Portfolio-Website", use '/Portfolio-Website/'
// If your repo is "username.github.io", use '/'
// If your repo has a different name, replace "Portfolio-Website" with your repo name
export default defineConfig({
  plugins: [react()],
  base:
    process.env.NODE_ENV === "production" ? "/AvaneeshMPortfolioSite/" : "/",
});
