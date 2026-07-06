
## Prasyarat manual (kamu, sekali setup)

Sebelum saya bisa implement 2-way sync, ada 2 langkah manual di sisi kamu:

### 1. Paste Client ID + Client Secret ke Cloud Auth Settings

Di panel **Cloud → Users → Auth Settings → Sign In Methods → Google Provider**:
- **Client ID (for OAuth)**: paste Client ID yang sama dari Google Cloud Console
- **Client Secret (for OAuth)**: paste Client Secret dari Google Cloud Console (halaman Credentials, di samping Client ID — kalau belum keliatan, klik ikon mata/"Reset secret")
- **Authorized Client IDs**: kosongkan (khusus native app)
- **Save**

Langkah ini yang bikin tombol "Masuk dengan Google" pakai OAuth app kamu — syarat wajib biar bisa minta scope `calendar.events`. Kalau di-skip, Google tetep pakai managed client Lovable yang cuma boleh scope `openid email profile`.

### 2. Tambah Redirect URI di Google Cloud Console

Di Credentials → OAuth Client ID kamu → **Authorized redirect URIs**, tambahkan URL callback Supabase (formatnya `https://<project-ref>.supabase.co/auth/v1/callback`) — URL persisnya keliatan di panel Cloud Auth Google Provider setelah kamu save Client ID/Secret. Copy dari sana.

### 3. Client Secret di Project Secrets

Saya akan minta kamu paste **`Client_Secret`** ke Project Secrets (via tool `add_secret`) — dipakai server function buat exchange refresh token → access token saat bikin/edit event di background (independen dari login user).

---

## Implementasi (yang saya kerjakan setelah prasyarat siap)

### A. Database

Migration baru:

```sql
-- Simpan refresh token per user (admin & teknisi yang connect)
CREATE TABLE public.user_google_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  google_email TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_google_tokens TO authenticated;
GRANT ALL ON public.user_google_tokens TO service_role;

ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tokens" ON public.user_google_tokens
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Kolom di ac_orderan buat track event Google
ALTER TABLE public.ac_orderan
  ADD COLUMN google_event_id TEXT,
  ADD COLUMN email_pelanggan TEXT;

-- Tambah email di teknisi buat auto-invite lewat attendees
ALTER TABLE public.ac_teknisi
  ADD COLUMN email TEXT;
```

### B. Auth flow — connect Google Calendar

Di `src/routes/_app.profil.tsx` (admin) dan `src/routes/_app.teknisi.tsx` (per-teknisi, kalau teknisi punya akun login), tambah tombol **"Hubungkan Google Calendar"**:

```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    scopes: 'https://www.googleapis.com/auth/calendar.events',
    queryParams: { access_type: 'offline', prompt: 'consent' },
    redirectTo: `${window.location.origin}/google-callback`,
  },
});
```

Route baru `src/routes/google-callback.tsx`: setelah Supabase set session, ambil `provider_refresh_token` + `provider_token` dari session, panggil server function `saveGoogleTokens` yang nyimpen ke `user_google_tokens`, terus redirect ke `/profil` atau `/teknisi`.

### C. Server functions (`src/lib/api/google-calendar.functions.ts`)

- `saveGoogleTokens({ refresh_token, access_token, expires_at, scope, email })` — insert/upsert ke `user_google_tokens` untuk `context.userId`.
- `getFreshAccessToken(userId)` — helper server-only: cek `expires_at`; kalau expired, POST ke `https://oauth2.googleapis.com/token` pakai `Client_ID` + `Client_Secret` + refresh_token, update row.
- `createCalendarEvent({ orderanId })` — pakai `requireSupabaseAuth`; ambil orderan + teknisi + admin, panggil `POST https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all` di calendar admin, dengan `attendees: [teknisi.email, email_pelanggan?]`. Simpan `google_event_id` ke `ac_orderan`.
- `updateCalendarEvent({ orderanId })` — PATCH event kalau tanggal/jam berubah.
- `deleteCalendarEvent({ orderanId })` — DELETE event kalau orderan di-cancel/hapus.

### D. Integrasi UI

- `src/components/OrderanDialog.tsx`: setelah insert orderan sukses, panggil `createCalendarEvent({ orderanId })`. Kalau admin belum connect Google, tampilin toast "Hubungkan Google Calendar dulu di Profil biar event otomatis dibuat" (booking tetap tersimpan).
- Setelah edit tanggal/status: panggil `updateCalendarEvent` / `deleteCalendarEvent`.
- `src/routes/book.tsx`: **tombol "Tambahkan ke Google Calendar" (yang sudah ada)** dipertahankan buat pelanggan — pelanggan yang isi email di form booking (opsional) juga otomatis dapat undangan event dari `attendees` waktu admin nge-connect.

### E. UX

- Kartu "Google Calendar" di halaman Profil admin: status connected/disconnected + email Google yang terhubung + tombol disconnect (hapus row `user_google_tokens`).
- Sama untuk detail teknisi (kalau teknisi login sendiri; kalau tidak, cukup field email di form teknisi biar bisa di-invite lewat attendees).

---

## Yang saya butuh dari kamu sebelum eksekusi

- Konfirm langkah 1 & 2 di atas sudah beres (paste Client ID+Secret ke Cloud Auth Settings + tambah redirect URI di Google Cloud Console).
- Approve plan ini → saya jalanin migration, add secret `Client_Secret`, dan tulis semua file.

Kalau kamu mau saya mulai dulu di bagian yang gak butuh Cloud Auth (kolom DB + form email teknisi + tombol connect UI) sambil kamu setup, bilang aja.
