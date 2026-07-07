import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveGoogleTokens } from "@/lib/api/google-calendar.functions";
import { useServerFn } from "@tanstack/react-start";

/**
 * Callback yang menangani hasil OAuth Google Calendar.
 * User dikirim ke sini setelah popup consent Google selesai;
 * kita ambil provider_refresh_token dari session Supabase dan simpan
 * ke tabel user_google_tokens supaya server bisa akses calendar user
 * secara background.
 */
export const Route = createFileRoute("/google-callback")({
  head: () => ({
    meta: [
      { title: "Menghubungkan Google Calendar..." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
  const navigate = useNavigate();
  const saveTokens = useServerFn(saveGoogleTokens);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Menyimpan koneksi Google Calendar...");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Supabase menaruh access_token & provider tokens di URL hash — client
        // otomatis parse. Beri sedikit waktu supaya session terbentuk.
        await new Promise((r) => setTimeout(r, 300));

        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr || !sessionData.session) {
          throw new Error(sessionErr?.message || "Sesi tidak ditemukan setelah login Google.");
        }

        const session = sessionData.session;
        const providerRefreshToken = (session as any).provider_refresh_token as
          | string
          | undefined;
        const providerAccessToken = session.provider_token ?? null;
        const providerTokenExpiresIn =
          (session as any).provider_token_expires_in as number | undefined;

        if (!providerRefreshToken) {
          throw new Error(
            "Google tidak mengirim refresh token. Pastikan Anda memberikan izin Google Calendar saat consent (klik 'Continue' di layar consent).",
          );
        }

        const expiresAt = providerTokenExpiresIn
          ? new Date(Date.now() + providerTokenExpiresIn * 1000).toISOString()
          : null;

        await saveTokens({
          data: {
            refresh_token: providerRefreshToken,
            access_token: providerAccessToken,
            expires_at: expiresAt,
            scope: "https://www.googleapis.com/auth/calendar.events",
            google_email: session.user.email ?? null,
          },
        });

        if (cancelled) return;
        setStatus("success");
        setMessage("Google Calendar berhasil terhubung! Mengarahkan...");
        setTimeout(() => navigate({ to: "/profil" }), 1000);
      } catch (err) {
        if (cancelled) return;
        console.error("[google-callback]", err);
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Gagal menyimpan koneksi Google.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, saveTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-lg text-center space-y-4">
        {status === "loading" && (
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        )}
        {status === "success" && (
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
        )}
        {status === "error" && <XCircle className="w-10 h-10 text-destructive mx-auto" />}
        <h1 className="text-lg font-bold">
          {status === "loading" && "Menghubungkan Google Calendar"}
          {status === "success" && "Berhasil"}
          {status === "error" && "Gagal"}
        </h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        {status === "error" && (
          <button
            onClick={() => navigate({ to: "/profil" })}
            className="text-sm text-primary hover:underline"
          >
            Kembali ke Profil
          </button>
        )}
      </div>
    </div>
  );
}
