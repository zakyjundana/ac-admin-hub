import { supabase } from "./supabase";

export type AuthUser = {
  id: string;
  email: string | undefined;
  nama?: string;
  namaBisnis?: string;
  noHp?: string;
  subscriptionTier?: "free" | "starter" | "pro";
  subscriptionStatus?: string;
};

/** Daftar akun baru */
export async function signUp(params: {
  email: string;
  password: string;
  nama: string;
  namaBisnis: string;
  noHp: string;
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        nama: params.nama,
        nama_bisnis: params.namaBisnis,
        no_hp: params.noHp,
        subscription_tier: "free",
        subscription_status: "active",
      },
    },
  });
  if (error) throw error;
  return data;
}

/** Masuk dengan email & password */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  // Set session cookie IMMEDIATELY so that _app.tsx beforeLoad can detect
  // authentication on the next full-page navigation (window.location.href).
  // Without this, the cookie is only set by useAuth's useEffect which runs
  // AFTER React mounts — too late for the beforeLoad guard.
  if (data.session && typeof document !== "undefined") {
    document.cookie = `sb-session=active; path=/; max-age=${3600 * 24 * 7}; SameSite=Lax`;
  }
  // Auto-disable demo mode for verified users upon login
  if (data.user?.id && typeof window !== "undefined") {
    localStorage.setItem("coolservice_demo_mode_" + data.user.id, "false");
  }
  return data;
}

/** Keluar */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Ambil sesi saat ini */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Ambil user saat ini */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("demo_user_profile");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Ignore parse errors
        }
      }
    }
    return {
      id: "demo-user-id",
      email: "demo@coolservice.com",
      nama: "Budi Santoso",
      namaBisnis: "CoolService Mandiri",
      noHp: "081234567890",
      subscriptionTier: "free",
      subscriptionStatus: "active",
    };
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    nama: data.user.user_metadata?.nama,
    namaBisnis: data.user.user_metadata?.nama_bisnis,
    noHp: data.user.user_metadata?.no_hp,
    subscriptionTier: data.user.user_metadata?.subscription_tier || "free",
    subscriptionStatus: data.user.user_metadata?.subscription_status || "active",
  };
}

let runtimeConfigured = false;

export function setRuntimeConfigured(configured: boolean) {
  runtimeConfigured = configured;
}

/** Cek apakah Supabase sudah dikonfigurasi */
export function isSupabaseConfigured() {
  const isServer = typeof window === "undefined";
  if (isServer) {
    const env = typeof process !== "undefined" ? process.env : {};
    return (
      (!!env.SB_URL && !!env.SB_ANON_KEY) ||
      (!!env.VITE_SB_URL && !!env.VITE_SB_ANON_KEY) ||
      (!!env.VITE_SUPABASE_URL && !!env.VITE_SUPABASE_ANON_KEY) ||
      (!!env.SUPABASE_URL && !!env.SUPABASE_ANON_KEY)
    );
  }
  return (
    runtimeConfigured ||
    (!!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY) ||
    (!!import.meta.env.VITE_SB_URL && !!import.meta.env.VITE_SB_ANON_KEY)
  );
}

/** Perbarui data profil user */
export async function updateProfile(params: {
  nama: string;
  namaBisnis: string;
  noHp: string;
}) {
  if (!isSupabaseConfigured()) {
    if (typeof window !== "undefined") {
      const demoUser: AuthUser = {
        id: "demo-user-id",
        email: "demo@coolservice.com",
        nama: params.nama,
        namaBisnis: params.namaBisnis,
        noHp: params.noHp,
        subscriptionTier: "free",
        subscriptionStatus: "active",
      };
      localStorage.setItem("demo_user_profile", JSON.stringify(demoUser));
    }
    return { user: null };
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      nama: params.nama,
      nama_bisnis: params.namaBisnis,
      no_hp: params.noHp,
    },
  });
  if (error) throw error;
  return data;
}

