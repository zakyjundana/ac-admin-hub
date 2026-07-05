import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

// Detect Supabase Anon Key from any possible environment variable name
const supabaseAnonKey =
  process.env.SB_ANON_KEY ||
  process.env.VITE_SB_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

function getProjectRefFromJwt(key: string) {
  try {
    const payload = key.split(".")[1];
    if (!payload) return "";
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { ref?: unknown };
    return typeof parsed.ref === "string" ? parsed.ref : "";
  } catch {
    return "";
  }
}

function isMatchingSupabaseUrl(url: string, ref: string) {
  if (!url || !ref) return true;
  try {
    return new URL(url).hostname.startsWith(`${ref}.`) || new URL(url).hostname.includes("lovable.cloud");
  } catch {
    return false;
  }
}

const configuredSupabaseUrl =
  process.env.SB_URL ||
  process.env.VITE_SB_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";
const supabaseProjectRef = getProjectRefFromJwt(supabaseAnonKey);
const supabaseUrl = isMatchingSupabaseUrl(configuredSupabaseUrl, supabaseProjectRef)
  ? configuredSupabaseUrl
  : `https://${supabaseProjectRef}.supabase.co`;

// Build defines object
const defineOverrides: Record<string, string> = {};

// ONLY override variables in define if we actually have values detected from process.env at build time.
if (supabaseUrl) {
  defineOverrides["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(supabaseUrl);
  defineOverrides["import.meta.env.VITE_SB_URL"] = JSON.stringify(supabaseUrl);
}
if (supabaseAnonKey) {
  defineOverrides["import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(supabaseAnonKey);
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
    plugins: [mcpPlugin()],
  },
});
