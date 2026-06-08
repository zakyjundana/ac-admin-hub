import { createClient } from "@supabase/supabase-js";

// Helper to get Supabase Admin Client (runs only on server)
export function getSupabaseAdmin() {
  const env = typeof process !== "undefined" ? process.env : {};
  const url = import.meta.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceRole =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SB_SERVICE_ROLE_KEY ||
    env.SERVICE_ROLE_KEY;
  if (!serviceRole) {
    console.warn(
      "WARNING: SUPABASE_SERVICE_ROLE_KEY / SB_SERVICE_ROLE_KEY is not configured. Database updates will be skipped.",
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
