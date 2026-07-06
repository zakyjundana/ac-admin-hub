## Masalah 1: Login Google balik ke /login terus

**Akar masalah:** Ada **dua Supabase client** yang jalan bersamaan:

- `src/integrations/supabase/client.ts` (auto-generated) — dipakai oleh `@lovable.dev/cloud-auth-js` untuk `setSession()` setelah Google OAuth berhasil.
- `src/lib/supabase.ts` (custom, pakai proxy + `initializeSupabase`) — dipakai oleh `useAuth`, `_app.tsx` beforeLoad, dan `login.tsx` beforeLoad untuk cek `getSession()`.

Kedua client menulis session ke **localStorage key yang berbeda** (dan bahkan bisa beda project ref). Akibatnya:

1. Klik "Masuk dengan Google" → popup sukses → lovable client `setSession(tokens)` di client A.
2. `window.location.href = '/dashboard'` → full reload.
3. `_app.tsx` beforeLoad panggil `getSession()` dari client B → **null** → `redirect({ to: '/login' })`.
4. `/login` beforeLoad juga cek client B → null → tampil form login lagi.

Login email/password kelihatannya jalan karena `signIn()` di `src/lib/auth.ts` pakai `@/lib/supabase` (client B) langsung — session-nya konsisten. Google OAuth-lah yang bocor antar client.

### Fix

Konsolidasi ke **satu** Supabase client — yang auto-generated (`src/integrations/supabase/client.ts`), karena file itu tidak boleh diedit dan sudah dipakai oleh lovable auth helper.

1. Ubah `src/lib/supabase.ts` jadi re-export dari `@/integrations/supabase/client` (buang proxy custom + `initializeSupabase`).
2. Hapus panggilan `initializeSupabase` di `useAuth.ts` (tidak dibutuhkan; env var `VITE_SUPABASE_*` sudah di-inject saat build).
3. `getSupabaseConfig` fetch runtime bisa disederhanakan/dihapus dari `useAuth` (client generated udah baca `import.meta.env` langsung).
4. Sederhanakan `isSupabaseConfigured()` — cukup cek `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. `redirect_uri` Google tetap `${window.location.origin}/login` (public route, aman), tapi karena kini pakai satu client, session yang di-set setelah popup akan langsung terlihat oleh `_app.tsx`.

Setelah patch, verifikasi via Playwright: login Google → landing di `/dashboard` (bukan `/login`).

---

## Masalah 2: Integrasi Google Calendar untuk booking

User minta **semua kalender ikut sinkron**: teknisi, pemesan (pelanggan), dan pemilik bisnis. Tapi tiap peran punya model auth berbeda, jadi diimplementasikan bertahap dengan pendekatan yang paling ringan dulu.

### Arsitektur

| Peran | Cara koneksi | Alasan |
|---|---|---|
| **Pemilik bisnis (admin)** | OAuth per-user via Supabase (`supabase.auth.signInWithOAuth('google', { scopes: 'calendar' })`) — token disimpan di `user_google_tokens`. Event otomatis dibuat saat orderan masuk. | Admin sudah login ke app; tinggal minta scope tambahan sekali. |
| **Teknisi** | Sama — teknisi login pakai Google di halaman profil teknisi (opsi "Hubungkan Google Calendar"). Token per-teknisi disimpan. Event auto-invite teknisi yang di-assign. | Perlu OAuth per akun teknisi. |
| **Pemesan/pelanggan** | **"Add to Google Calendar" link** (`calendar.google.com/render?action=TEMPLATE&...`) di halaman konfirmasi booking + di WhatsApp/invoice. **Tanpa OAuth** karena pelanggan tidak login. | Paling ringan, zero-friction, tidak perlu simpan token pelanggan. |

Ditambah lagi: teknisi & admin di-invite lewat field `attendees` di event Google Calendar milik admin, jadi mereka terima undangan otomatis walaupun belum connect. Koneksi Google Calendar milik teknisi/admin dipakai buat 2-way sync kalau mereka mau kelolanya dari Google Calendar mereka sendiri.

### Perubahan implementasi

1. **DB migration**: tabel `user_google_tokens` (user_id, access_token, refresh_token, expires_at, scope). RLS: user hanya baca/tulis token miliknya. GRANT sesuai standar.
2. **Auth flow**: tombol "Hubungkan Google Calendar" di `/_app/profil` (untuk admin) dan `/_app/teknisi` detail (untuk tiap teknisi). Pakai `supabase.auth.signInWithOAuth` dengan scope `https://www.googleapis.com/auth/calendar.events` + `queryParams: { access_type: 'offline', prompt: 'consent' }` biar dapat refresh token.
3. **Callback handler** `/routes/api/public/google-callback.ts` (atau reuse `/login` callback) — simpan token ke `user_google_tokens`.
4. **Server function** `createCalendarEvent.functions.ts`:
   - Trigger saat orderan dibuat/diupdate.
   - Ambil token admin dari `user_google_tokens`, refresh jika expired.
   - POST ke `https://www.googleapis.com/calendar/v3/calendars/primary/events` dengan `attendees: [{ email: teknisi.email }, { email: pelanggan.email }]` dan `sendUpdates: 'all'`.
   - Simpan `google_event_id` di row `ac_orderan` biar bisa update/hapus.
5. **Booking page** (`src/routes/book.tsx`): setelah submit sukses, tampilkan tombol **"Tambah ke Google Calendar"** yang buka URL `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&location=...&details=...` di tab baru.
6. **Kolom baru di `ac_orderan`**: `google_event_id TEXT`, `email_pelanggan TEXT NULL` (untuk invite pelanggan opsional).

### Konfirmasi kredensial

Google OAuth client yang dipakai Supabase Auth saat ini adalah **managed Lovable Cloud** (default). Managed client itu hanya minta scope `openid email profile` — **tidak bisa** minta `calendar.events`. Jadi user perlu:

- **Pakai OAuth client Google sendiri** (BYO): buat project di Google Cloud Console, enable Google Calendar API, buat OAuth Client ID (Web), taruh Client ID + Secret di Lovable Cloud Auth Settings → Google.

Ini prasyarat wajib untuk fitur sync 2-way. Kalau user belum siap urus Google Cloud Console, kita bisa **kirim fitur 1 (login Google fixed) + tombol "Add to Google Calendar" untuk semua peran** lebih dulu (tanpa OAuth calendar), lalu 2-way sync menyusul setelah BYO OAuth terpasang.

---

## Detail teknis (untuk implementasi)

**File yang diubah untuk Fix Login:**
- `src/lib/supabase.ts` — jadi thin re-export.
- `src/hooks/useAuth.ts` — hapus `initializeSupabase` + `getSupabaseConfig` init block.
- `src/lib/auth.ts` — sederhanakan `isSupabaseConfigured()`.
- `src/hooks/useIsConfigured.ts` — bisa disederhanakan (opsional).

**File baru/diubah untuk Google Calendar:**
- Migration: `user_google_tokens` + kolom `google_event_id`, `email_pelanggan` di `ac_orderan`.
- `src/lib/api/google-calendar.functions.ts` — createEvent/updateEvent/deleteEvent + token refresh.
- `src/lib/googleCalendarLink.ts` — helper generate URL "Add to Google Calendar".
- `src/routes/book.tsx` — tombol setelah booking sukses + input email opsional.
- `src/routes/_app.profil.tsx` — tombol "Hubungkan Google Calendar" untuk admin.
- `src/components/OrderanDialog.tsx` — trigger `createCalendarEvent` setelah insert.
- Hooks Supabase auth: pastikan `redirect_uri` OAuth calendar tidak bentrok dengan login flow (pakai state param untuk bedakan).

---

## Pertanyaan sebelum eksekusi

1. Sudah punya (atau mau bikin) **OAuth Client Google sendiri** di Google Cloud Console untuk fitur sync kalender? Kalau belum, saya kerjakan **Fix Login + tombol "Add to Google Calendar" (tanpa OAuth)** dulu; sync 2-way menyusul setelah credential siap.
2. Untuk pelanggan, cukup tombol "Add to Google Calendar" (tanpa perlu login) — konfirm?
