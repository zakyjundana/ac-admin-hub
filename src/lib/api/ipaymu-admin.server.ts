import process from "node:process";
import { createClient } from "@supabase/supabase-js";

// Helper to get Supabase Admin Client (runs only on server)
export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SB_SERVICE_ROLE_KEY ||
    process.env.SERVICE_ROLE_KEY;
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
