import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SB_URL) as string | undefined;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SB_ANON_KEY) as string | undefined;

// CRITICAL: Supabase v2 throws "supabaseUrl is required" when URL is empty string.
// Use placeholder values so createClient() succeeds — all API calls will simply
// return network errors (acceptable in demo mode). Real auth only works when
// both env vars are properly set via Lovable Secrets.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key-for-demo-mode",
);
