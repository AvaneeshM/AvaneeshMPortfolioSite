import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
// For GitHub Pages: use '/AvaneeshMPortfolioSite/'
// For Vercel: use '/' (serves from root domain)
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL
    ? "/"
    : process.env.NODE_ENV === "production"
    ? "/AvaneeshMPortfolioSite/"
    : "/",
});
