import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            /recharts|d3-|victory|decimal|internmap|robust-predicates/.test(id)
          )
            return "charts";
          if (/react|scheduler/.test(id) && !id.includes("lucide-react"))
            return "react-vendor";
        },
      },
    },
  },
});