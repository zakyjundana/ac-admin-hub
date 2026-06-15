import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Detect Supabase URL from any possible environment variable name
const supabaseUrl =
  process.env.SB_URL ||
  process.env.VITE_SB_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";

// Detect Supabase Anon Key from any possible environment variable name
const supabaseAnonKey =
  process.env.SB_ANON_KEY ||
  process.env.VITE_SB_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

// Build defines object
const defineOverrides: Record<string, string> = {};

// ONLY override variables in define if we actually have values detected from process.env at build time.
if (supabaseUrl) {
  defineOverrides["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(supabaseUrl);
  defineOverrides["import.meta.env.VITE_SB_URL"] = JSON.stringify(supabaseUrl);
}
if (supabaseAnonKey) {
  defineOverrides["import.meta.env.VITE_SUPABASE_ANON_KEY"] = JSON.stringify(supabaseAnonKey);
  defineOverrides["import.meta.env.VITE_SB_ANON_KEY"] = JSON.stringify(supabaseAnonKey);
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: defineOverrides,
  },
});
