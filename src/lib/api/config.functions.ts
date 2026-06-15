import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

export const getSupabaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const env = typeof process !== "undefined" ? process.env : {};
  const url =
    env.SB_URL ||
    env.VITE_SB_URL ||
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    "";
  const anonKey =
    env.SB_ANON_KEY ||
    env.VITE_SB_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    "";
  return { url, anonKey };
});

export const checkServerSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();
  const cookie = headers.get("cookie") || "";
  const isAuthenticated = cookie.includes("sb-session=active");
  return { isAuthenticated };
});
