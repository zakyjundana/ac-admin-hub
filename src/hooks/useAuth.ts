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
    if (!isSupabaseConfigured()) {
      getCurrentUser().then((u) => {
        store.syncUser(null); // Demo mode uses default mock data
        setState({
          loading: false,
          user: u,
        });
      });
      return;
    }

    // Ambil sesi awal
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      store.syncUser(u?.id ?? null); // Sync data store to the user
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
    });

    // Dengarkan perubahan auth state
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      store.syncUser(u?.id ?? null); // Sync data store to the user on change
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
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return state;
}
