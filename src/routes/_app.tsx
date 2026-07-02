import { createFileRoute, redirect } from "@tanstack/react-router";
import { ShellRoute } from "@/components/AppShell";
import { isSupabaseConfigured } from "@/lib/auth";
import { checkServerSession } from "@/lib/api/config.functions";

export const Route = createFileRoute("/_app")({
  // Disable SSR for protected shell routes so authenticated content is never
  // rendered on the server based on a trivially-spoofable cookie. Auth is
  // always verified on the client using the Supabase SDK below.
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      // On server: never render protected content. Redirect to login; the
      // client will re-run beforeLoad and perform the real auth check.
      throw redirect({ to: "/login" });
    }

    let isAuthenticated = false;
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        isAuthenticated = true;
        document.cookie = `sb-session=active; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax`;
      }
    } catch {
      isAuthenticated = false;
    }

    if (!isAuthenticated) {
      throw redirect({ to: "/login" });
    }

    // Redirect to onboarding if the user has not completed onboarding
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();
    if (session?.user && !session.user.user_metadata?.onboarding_done) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: ShellRoute,
});

