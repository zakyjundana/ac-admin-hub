import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically generate .env file during build from Lovable Secrets
if (process.env.SB_URL && process.env.SB_ANON_KEY) {
  try {
    const envContent = `VITE_SB_URL=${process.env.SB_URL}\nVITE_SB_ANON_KEY=${process.env.SB_ANON_KEY}\n`;
    fs.writeFileSync(path.resolve(__dirname, ".env"), envContent);
    console.log("[Build] Successfully generated .env file from Lovable Secrets.");
  } catch (err) {
    console.error("[Build] Failed to generate .env file:", err);
  }
}

// Build defines object
const defineOverrides: Record<string, string> = {};

// ONLY override variables in define if we actually have custom process.env values.
// This prevents overriding the default Vite environment variables loaded from platform injection/dotfiles.
if (process.env.SB_URL) {
  defineOverrides["import.meta.env.VITE_SB_URL"] = JSON.stringify(process.env.SB_URL);
  defineOverrides["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(process.env.SB_URL);
} else if (process.env.VITE_SB_URL) {
  defineOverrides["import.meta.env.VITE_SB_URL"] = JSON.stringify(process.env.VITE_SB_URL);
  defineOverrides["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(process.env.VITE_SB_URL);
}

if (process.env.SB_ANON_KEY) {
  defineOverrides["import.meta.env.VITE_SB_ANON_KEY"] = JSON.stringify(process.env.SB_ANON_KEY);
  defineOverrides["import.meta.env.VITE_SUPABASE_ANON_KEY"] = JSON.stringify(process.env.SB_ANON_KEY);
} else if (process.env.VITE_SB_ANON_KEY) {
  defineOverrides["import.meta.env.VITE_SB_ANON_KEY"] = JSON.stringify(process.env.VITE_SB_ANON_KEY);
  defineOverrides["import.meta.env.VITE_SUPABASE_ANON_KEY"] = JSON.stringify(process.env.VITE_SB_ANON_KEY);
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  define: defineOverrides
});
