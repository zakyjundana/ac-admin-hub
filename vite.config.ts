import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  define: {
    "import.meta.env.VITE_SB_URL": JSON.stringify(process.env.SB_URL || process.env.VITE_SB_URL || ""),
    "import.meta.env.VITE_SB_ANON_KEY": JSON.stringify(process.env.SB_ANON_KEY || process.env.VITE_SB_ANON_KEY || ""),
  }
});
