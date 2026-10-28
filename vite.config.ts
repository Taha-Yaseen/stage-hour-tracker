import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/stage-hour-tracker/",
  plugins: [react()],
});
