import { createClient } from "@supabase/supabase-js";

// Helper to get Supabase Admin Client (runs only on server)
export function getSupabaseAdmin() {
  const env = typeof process !== "undefined" ? process.env : {};
  const url =
    env.SB_URL ||
    env.VITE_SB_URL ||
    import.meta.env.VITE_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    "https://placeholder.supabase.co";
  const serviceRole =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SB_SERVICE_ROLE_KEY ||
    env.SERVICE_ROLE_KEY;
  if (!serviceRole || url.includes("placeholder")) {
    console.warn(
      "WARNING: Supabase URL or Service Role Key is not configured correctly. Database updates will be skipped.",
    );
    return null;
  }
  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
