import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { AuthUser } from "@/lib/auth";
import { store } from "@/lib/dataStore";
import type { User } from "@supabase/supabase-js";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let active = true;
    let listenerSubscription: { unsubscribe: () => void } | undefined;

    function toAuthUser(user: User): AuthUser {
      return {
        id: user.id,
        email: user.email,
        nama: user.user_metadata?.nama,
        namaBisnis: user.user_metadata?.nama_bisnis,
        noHp: user.user_metadata?.no_hp,
        subscriptionTier: user.app_metadata?.subscription_tier || "free",
        subscriptionStatus: user.app_metadata?.subscription_status || "active",
      };
    }

    async function initAuth() {
      if (!active) return;

      // Ambil sesi awal
      try {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user ?? null;
        store.syncUser(u?.id ?? null);
        if (active) {
          if (u) {
            const tier = u.app_metadata?.subscription_tier || "free";
            const subStatus = u.app_metadata?.subscription_status || "active";
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
            user: u ? toAuthUser(u) : null,
          });
        }
      } catch (err) {
        console.error("Auth session fetch error:", err);
        if (active) setState({ user: null, loading: false });
      }

      // Dengarkan perubahan auth state
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        const u = session?.user ?? null;
        store.syncUser(u?.id ?? null);
        if (active) {
          if (u) {
            const tier = u.app_metadata?.subscription_tier || "free";
            const subStatus = u.app_metadata?.subscription_status || "active";
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
            user: u ? toAuthUser(u) : null,
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
