import { useState, useEffect } from "react";
import { supabase, initializeSupabase } from "@/lib/supabase";
import { isSupabaseConfigured, setRuntimeConfigured, getCurrentUser, type AuthUser } from "@/lib/auth";
import { store } from "@/lib/dataStore";
import { getSupabaseConfig } from "@/lib/api/config.functions";

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
      // 1. If not configured, fetch from server environment
      if (!isSupabaseConfigured()) {
        try {
          const config = await getSupabaseConfig();
          if (config.url && config.anonKey) {
            initializeSupabase(config.url, config.anonKey);
            setRuntimeConfigured(true);
          }
        } catch (err) {
          console.warn("Failed to fetch runtime supabase config:", err);
        }
      }

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
        if (active) {
          setState({
            loading: false,
            user: u
              ? {
                  id: u.id,
                  email: u.email,
                  nama: u.user_metadata?.nama,
                  namaBisnis: u.user_metadata?.nama_bisnis,
                  noHp: u.user_metadata?.no_hp,
                  subscriptionTier: u.user_metadata?.subscription_tier || "free",
                  subscriptionStatus: u.user_metadata?.subscription_status || "active",
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
        if (active) {
          setState({
            loading: false,
            user: u
              ? {
                  id: u.id,
                  email: u.email,
                  nama: u.user_metadata?.nama,
                  namaBisnis: u.user_metadata?.nama_bisnis,
                  noHp: u.user_metadata?.no_hp,
                  subscriptionTier: u.user_metadata?.subscription_tier || "free",
                  subscriptionStatus: u.user_metadata?.subscription_status || "active",
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
