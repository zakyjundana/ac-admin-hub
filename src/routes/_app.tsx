import { createFileRoute, redirect } from "@tanstack/react-router";
import { ShellRoute } from "@/components/AppShell";
import { isSupabaseConfigured } from "@/lib/auth";
import { checkServerSession } from "@/lib/api/config.functions";

export const Route = createFileRoute("/_app")({
  beforeLoad: async () => {
    // If Supabase is not configured (demo mode), skip auth guard
    if (!isSupabaseConfigured()) return;

    let isAuthenticated = false;
    if (typeof window === "undefined") {
      // Server-side (SSR) cookie check using server function
      const res = await checkServerSession();
      isAuthenticated = res.isAuthenticated;
    } else {
      // Client-side: first try the fast cookie check
      const cookie = document.cookie || "";
      if (cookie.includes("sb-session=active")) {
        isAuthenticated = true;
      } else {
        // Cookie missing (e.g., first navigation after login before useAuth
        // has set the cookie via useEffect). Fall back to asking Supabase directly.
        try {
          const { supabase } = await import("@/lib/supabase");
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            isAuthenticated = true;
            // Eagerly set the cookie so future navigations are instant
            document.cookie = `sb-session=active; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax`;
          }
        } catch {
          isAuthenticated = false;
        }
      }
    }

    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }

    // Redirect to onboarding on client if the user has not completed onboarding
    if (typeof window !== "undefined") {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      if (session?.user && !session.user.user_metadata?.onboarding_done) {
        throw redirect({ to: "/onboarding" });
      }
    }
  },
  component: ShellRoute,
});
