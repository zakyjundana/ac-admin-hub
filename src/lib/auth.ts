import { supabase } from "./supabase";

export type AuthUser = {
  id: string;
  email: string | undefined;
  nama?: string;
  namaBisnis?: string;
  noHp?: string;
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
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    nama: data.user.user_metadata?.nama,
    namaBisnis: data.user.user_metadata?.nama_bisnis,
    noHp: data.user.user_metadata?.no_hp,
  };
}

/** Cek apakah Supabase sudah dikonfigurasi */
export function isSupabaseConfigured() {
  return (
    !!import.meta.env.VITE_SUPABASE_URL &&
    !!import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}
