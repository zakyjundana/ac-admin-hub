import { createFileRoute, redirect } from "@tanstack/react-router";
import { ShellRoute } from "@/components/AppShell";
import { isSupabaseConfigured, getSession } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    // IMPORTANT: Only run auth check on client side.
    // During SSR (Cloudflare Workers), localStorage does not exist.
    // Redirecting on the server would also break client hydration.
    if (typeof window === "undefined") return;

    // If Supabase is not configured (demo mode), skip auth guard
    if (!isSupabaseConfigured()) return;

    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: ShellRoute,
});
