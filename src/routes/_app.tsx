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

    // Redirect to onboarding if the user has not completed onboarding
    if (session.user && !session.user.user_metadata?.onboarding_done) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: ShellRoute,
});
