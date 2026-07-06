// Re-export the auto-generated Supabase client so the whole app uses a single
// instance. Previously this file created a separate client with its own
// localStorage session key, which caused Google OAuth (via @lovable.dev/cloud-auth-js)
// to set the session on ONE client while route guards read from ANOTHER — resulting
// in an infinite redirect back to /login after successful Google sign-in.
//
// The generated client is typed against `Database`, but this project's `ac_*`
// tables aren't in the generated types yet (data currently lives client-side).
// We cast the export to an untyped SupabaseClient so existing callers keep
// compiling until types are regenerated.
import { supabase as _typedSupabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const supabase = _typedSupabase as unknown as SupabaseClient;

/**
 * Deprecated: kept as a no-op so legacy call sites don't break.
 * The generated client reads VITE_SUPABASE_* at build time; no runtime init needed.
 */
export function initializeSupabase(_url: string, _anonKey: string) {
  // no-op
}
