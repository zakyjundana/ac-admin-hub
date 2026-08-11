import { createFileRoute, redirect } from "@tanstack/react-router";
import { ShellRoute } from "@/components/AppShell";

export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const next = `${location.pathname}${location.searchStr}`;
      throw redirect({ to: "/login", search: { next } });
    }
    if (!data.user.user_metadata?.onboarding_done) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: ShellRoute,
});

