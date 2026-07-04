import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Wrench, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// The supabase.auth.oauth namespace is beta - typed wrapper for the 3 methods we use.
type OAuthDetails = {
  client?: { name?: string; client_uri?: string; redirect_uris?: string[] };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResult = { data: OAuthDetails | null; error: { message: string } | null };
interface SupabaseOAuth {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
}
function oauth(): SupabaseOAuth {
  return (supabase.auth as unknown as { oauth: SupabaseOAuth }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) {
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      window.location.href = immediate;
      return data;
    }
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold mb-2">Tidak dapat memuat permintaan otorisasi</h1>
        <p className="text-sm text-gray-400">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("Server otorisasi tidak mengembalikan URL redirect.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "Aplikasi";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">CoolService</span>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <h1 className="text-xl font-bold mb-2">
            Hubungkan <span className="text-blue-400">{clientName}</span> ke CoolService
          </h1>
          <p className="text-sm text-gray-400 mb-5">
            Aplikasi ini akan dapat memanggil tools CoolService atas nama Anda selama Anda masih terhubung.
          </p>

          {details?.client?.redirect_uris && details.client.redirect_uris.length > 0 && (
            <div className="mb-4 text-xs text-gray-500">
              <div className="font-medium text-gray-400 mb-1">Redirect URI</div>
              <code className="block bg-black/40 rounded px-2 py-1 break-all">
                {details.client.redirect_uris[0]}
              </code>
            </div>
          )}

          <div className="space-y-2 mb-5">
            <div className="text-sm font-medium text-gray-300">Akses yang diminta:</div>
            <ul className="text-sm text-gray-400 space-y-1.5">
              <li>• Membaca profil dasar dan email Anda</li>
              <li>• Membaca dan membuat data servis AC (orderan, teknisi, stok, riwayat) milik akun Anda</li>
            </ul>
            {scopes.length > 0 && (
              <div className="text-xs text-gray-600 pt-2">
                Scope: <code className="text-gray-500">{scopes.join(" ")}</code>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-5">
            <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300">
              Izin aplikasi dan kebijakan backend tetap berlaku. Anda dapat mencabut akses kapan saja.
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2" role="alert">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(false)}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold transition-all disabled:opacity-60"
            >
              Batalkan
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(true)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Izinkan
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
