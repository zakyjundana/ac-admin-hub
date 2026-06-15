import { useState, useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/auth";

/**
 * Hook yang aman untuk SSR/hydration.
 * Selalu mengembalikan `false` saat SSR dan saat hydration pertama,
 * lalu update ke nilai sebenarnya setelah client mount.
 * Ini mencegah React error 418 (hydration mismatch).
 */
export function useIsConfigured(): boolean {
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
  }, []);

  return configured;
}
