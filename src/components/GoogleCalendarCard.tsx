import { useEffect, useState } from "react";
import { Calendar, Loader2, CheckCircle2, LinkIcon, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getGoogleConnectionStatus,
  disconnectGoogleCalendar,
} from "@/lib/api/google-calendar.functions";
import { useServerFn } from "@tanstack/react-start";

/**
 * Kartu koneksi Google Calendar untuk halaman Profil.
 * User bisa menghubungkan akun Google mereka supaya orderan otomatis
 * dibuat sebagai event di Google Calendar (dengan invite ke teknisi
 * & pelanggan lewat email attendees).
 */
export function GoogleCalendarCard() {
  const getStatus = useServerFn(getGoogleConnectionStatus);
  const disconnectFn = useServerFn(disconnectGoogleCalendar);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await getStatus();
      setConnected(res.connected);
      setEmail(res.email);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/calendar.events",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: `${window.location.origin}/google-callback`,
        },
      });
      if (error) throw error;
      // Browser akan diarahkan ke Google — komponen unmount.
    } catch (err: any) {
      toast.error(err?.message || "Gagal memulai koneksi Google Calendar.");
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Putuskan koneksi Google Calendar? Event yang sudah dibuat tidak akan terhapus.")) return;
    setBusy(true);
    try {
      await disconnectFn();
      toast.success("Koneksi Google Calendar diputus.");
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Gagal memutus koneksi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="size-11 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground shrink-0">
          <Calendar className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold">Google Calendar</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sinkronkan jadwal orderan langsung ke Google Calendar Anda. Teknisi &
            pelanggan bisa otomatis di-invite lewat email.
          </p>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Memeriksa status koneksi...
          </div>
        ) : connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span className="font-medium">Terhubung</span>
              {email && <span className="text-muted-foreground truncate">— {email}</span>}
            </div>
            <Button
              onClick={handleDisconnect}
              disabled={busy}
              variant="outline"
              className="gap-2"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Unplug className="size-4" />}
              Putuskan Koneksi
            </Button>
          </div>
        ) : (
          <Button onClick={handleConnect} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <LinkIcon className="size-4" />}
            Hubungkan Google Calendar
          </Button>
        )}
      </div>
    </div>
  );
}
