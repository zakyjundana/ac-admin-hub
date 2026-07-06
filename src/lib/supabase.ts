// Re-export the auto-generated Supabase client so the whole app uses a single
// instance. Previously this file created a separate client with its own
// localStorage session key, which caused Google OAuth (via @lovable.dev/cloud-auth-js)
// to set the session on ONE client while route guards read from ANOTHER — resulting
// in an infinite redirect back to /login after successful Google sign-in.
export { supabase } from "@/integrations/supabase/client";

/**
 * Deprecated: kept as a no-op so legacy call sites don't break.
 * The generated client reads VITE_SUPABASE_* at build time; no runtime init needed.
 */
export function initializeSupabase(_url: string, _anonKey: string) {
  // no-op
}
