import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SB_URL) as string | undefined;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SB_ANON_KEY) as string | undefined;

let activeClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key-for-demo-mode",
);

export function initializeSupabase(url: string, anonKey: string) {
  if (url && anonKey && !url.includes("placeholder")) {
    activeClient = createClient(url, anonKey);
    console.log("[Supabase] Re-initialized client with runtime credentials.");
  }
}

export const supabase = new Proxy({} as unknown as SupabaseClient, {
  get(target, prop, receiver) {
    const value = Reflect.get(activeClient, prop, receiver);
    if (typeof value === "function") {
      return value.bind(activeClient);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    return Reflect.set(activeClient, prop, value, receiver);
  }
});
