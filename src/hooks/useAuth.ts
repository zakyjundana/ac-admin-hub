import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured, getCurrentUser, type AuthUser } from "@/lib/auth";
import { store } from "@/lib/dataStore";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let active = true;
    let listenerSubscription: { unsubscribe: () => void } | undefined;

    async function initAuth() {
      // Supabase env vars are injected at build time; no runtime fetch needed.
      if (!active) return;


      // 2. Proceed with demo check or normal login check
      if (!isSupabaseConfigured()) {
        const u = await getCurrentUser();
        if (!active) return;
        store.syncUser(null); // Demo mode uses default mock data
        setState({
          loading: false,
          user: u,
        });
        return;
      }

      // Ambil sesi awal
      try {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user ?? null;
        store.syncUser(u?.id ?? null);
        if (typeof document !== "undefined") {
          document.cookie = `sb-session=${data.session ? "active" : ""}; path=/; max-age=${data.session ? 3600 * 24 * 7 : 0}; SameSite=Lax`;
        }
        if (active) {
          if (u) {
            const tier = (u as any).app_metadata?.subscription_tier || "free";
            const subStatus = (u as any).app_metadata?.subscription_status || "active";
            pendo.identify({
              visitor: {
                id: u.id,
                email: u.email,
                full_name: u.user_metadata?.nama,
                nama_bisnis: u.user_metadata?.nama_bisnis,
                subscription_tier: tier,
                subscription_status: subStatus,
              },
            });
          }
          setState({
            loading: false,
            user: u
              ? {
                  id: u.id,
                  email: u.email,
                  nama: u.user_metadata?.nama,
                  namaBisnis: u.user_metadata?.nama_bisnis,
                  noHp: u.user_metadata?.no_hp,
                  subscriptionTier: (u as any).app_metadata?.subscription_tier || "free",
                  subscriptionStatus: (u as any).app_metadata?.subscription_status || "active",
                }
              : null,
          });
        }
      } catch (err) {
        console.error("Auth session fetch error:", err);
        if (active) setState({ user: null, loading: false });
      }

      // Dengarkan perubahan auth state
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user ?? null;
        store.syncUser(u?.id ?? null);
        if (typeof document !== "undefined") {
          document.cookie = `sb-session=${session ? "active" : ""}; path=/; max-age=${session ? 3600 * 24 * 7 : 0}; SameSite=Lax`;
        }
        if (active) {
          if (u) {
            const tier = (u as any).app_metadata?.subscription_tier || "free";
            const subStatus = (u as any).app_metadata?.subscription_status || "active";
            pendo.identify({
              visitor: {
                id: u.id,
                email: u.email,
                full_name: u.user_metadata?.nama,
                nama_bisnis: u.user_metadata?.nama_bisnis,
                subscription_tier: tier,
                subscription_status: subStatus,
              },
            });
          }
          setState({
            loading: false,
            user: u
              ? {
                  id: u.id,
                  email: u.email,
                  nama: u.user_metadata?.nama,
                  namaBisnis: u.user_metadata?.nama_bisnis,
                  noHp: u.user_metadata?.no_hp,
                  subscriptionTier: (u as any).app_metadata?.subscription_tier || "free",
                  subscriptionStatus: (u as any).app_metadata?.subscription_status || "active",
                }
              : null,
          });
        }
      });

      listenerSubscription = listener.subscription;
    }

    initAuth();

    return () => {
      active = false;
      if (listenerSubscription) {
        listenerSubscription.unsubscribe();
      }
    };
  }, []);

  return state;
}
