import { createFileRoute, redirect } from "@tanstack/react-router";
import { ShellRoute } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  // Jika Supabase belum dikonfigurasi, lewati auth guard (mode demo/mock)
  beforeLoad: async () => {
    if (!isSupabaseConfigured()) return; // mode demo — boleh akses
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: ShellRoute,
});
