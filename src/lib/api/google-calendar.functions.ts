import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Google Calendar server functions.
 * Semua fn di sini butuh user login (pakai requireSupabaseAuth).
 * Token per-user disimpan di public.user_google_tokens.
 */

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface TokenRow {
  refresh_token: string;
  access_token: string | null;
  expires_at: string | null;
  google_email: string | null;
}

/**
 * Ambil access token yang masih valid untuk user.
 * Kalau expired atau kurang dari 60 detik lagi, refresh pakai refresh_token.
 */
async function getFreshAccessToken(
  supabase: any,
  userId: string,
): Promise<{ accessToken: string; googleEmail: string | null } | { error: string }> {
  const { data: row, error } = await supabase
    .from("user_google_tokens")
    .select("refresh_token, access_token, expires_at, google_email")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!row) return { error: "not_connected" };

  const token = row as TokenRow;
  const expiresAt = token.expires_at ? new Date(token.expires_at).getTime() : 0;
  const now = Date.now();

  // Kalau access token masih valid (buffer 60 detik), pakai yang ada.
  if (token.access_token && expiresAt > now + 60_000) {
    return { accessToken: token.access_token, googleEmail: token.google_email };
  }

  // Refresh access token.
  const clientId = process.env.Client_ID;
  const clientSecret = process.env.Client_Secret;
  if (!clientId || !clientSecret) {
    return { error: "Google OAuth client tidak dikonfigurasi di server (Client_ID / Client_Secret)." };
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[google-calendar] refresh failed", res.status, body);
    return { error: `Refresh token gagal (${res.status}). User perlu hubungkan ulang.` };
  }

  const payload = (await res.json()) as {
    access_token: string;
    expires_in: number;
    scope?: string;
  };

  const newExpiresAt = new Date(Date.now() + payload.expires_in * 1000).toISOString();

  await supabase
    .from("user_google_tokens")
    .update({
      access_token: payload.access_token,
      expires_at: newExpiresAt,
      scope: payload.scope ?? undefined,
    })
    .eq("user_id", userId);

  return { accessToken: payload.access_token, googleEmail: token.google_email };
}

/**
 * Simpan/refresh token Google Calendar untuk user yang sedang login.
 * Dipanggil dari halaman callback setelah supabase.auth.signInWithOAuth kembali.
 */
export const saveGoogleTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      refresh_token: string;
      access_token?: string | null;
      expires_at?: string | null;
      scope?: string | null;
      google_email?: string | null;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("user_google_tokens").upsert(
      {
        user_id: userId,
        refresh_token: data.refresh_token,
        access_token: data.access_token ?? null,
        expires_at: data.expires_at ?? null,
        scope: data.scope ?? null,
        google_email: data.google_email ?? null,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Cek apakah user sudah connect ke Google Calendar.
 */
export const getGoogleConnectionStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_google_tokens")
      .select("google_email, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      connected: !!data,
      email: data?.google_email ?? null,
      connectedAt: data?.updated_at ?? null,
    };
  });

/**
 * Putus koneksi Google Calendar (hapus token).
 */
export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("user_google_tokens").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Bikin event baru di Google Calendar milik user.
 * Return google_event_id yang bisa disimpan bareng orderan.
 */
export const createCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      title: string;
      description?: string;
      location?: string;
      startISO: string; // e.g. 2026-07-10T09:00:00
      endISO: string;
      attendeeEmails?: string[];
      timeZone?: string; // default Asia/Jakarta
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tokenResult = await getFreshAccessToken(supabase, userId);
    if ("error" in tokenResult) {
      return { ok: false as const, error: tokenResult.error };
    }

    const tz = data.timeZone ?? "Asia/Jakarta";
    const body = {
      summary: data.title,
      description: data.description,
      location: data.location,
      start: { dateTime: data.startISO, timeZone: tz },
      end: { dateTime: data.endISO, timeZone: tz },
      attendees: (data.attendeeEmails ?? [])
        .filter((e) => e && /.+@.+\..+/.test(e))
        .map((email) => ({ email })),
    };

    const res = await fetch(`${CALENDAR_API}?sendUpdates=all`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[google-calendar] create failed", res.status, errBody);
      return { ok: false as const, error: `Google Calendar error ${res.status}: ${errBody}` };
    }

    const event = (await res.json()) as { id: string; htmlLink?: string };
    return { ok: true as const, google_event_id: event.id, htmlLink: event.htmlLink };
  });

/**
 * Update event Google Calendar yang sudah ada.
 */
export const updateCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      google_event_id: string;
      title?: string;
      description?: string;
      location?: string;
      startISO?: string;
      endISO?: string;
      attendeeEmails?: string[];
      timeZone?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tokenResult = await getFreshAccessToken(supabase, userId);
    if ("error" in tokenResult) return { ok: false as const, error: tokenResult.error };

    const tz = data.timeZone ?? "Asia/Jakarta";
    const patch: Record<string, unknown> = {};
    if (data.title !== undefined) patch.summary = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.location !== undefined) patch.location = data.location;
    if (data.startISO) patch.start = { dateTime: data.startISO, timeZone: tz };
    if (data.endISO) patch.end = { dateTime: data.endISO, timeZone: tz };
    if (data.attendeeEmails)
      patch.attendees = data.attendeeEmails
        .filter((e) => e && /.+@.+\..+/.test(e))
        .map((email) => ({ email }));

    const res = await fetch(
      `${CALENDAR_API}/${encodeURIComponent(data.google_event_id)}?sendUpdates=all`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      },
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[google-calendar] update failed", res.status, errBody);
      return { ok: false as const, error: `Google Calendar error ${res.status}: ${errBody}` };
    }
    return { ok: true as const };
  });

/**
 * Hapus event Google Calendar.
 */
export const deleteCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { google_event_id: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tokenResult = await getFreshAccessToken(supabase, userId);
    if ("error" in tokenResult) return { ok: false as const, error: tokenResult.error };

    const res = await fetch(
      `${CALENDAR_API}/${encodeURIComponent(data.google_event_id)}?sendUpdates=all`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
      },
    );
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const errBody = await res.text();
      console.error("[google-calendar] delete failed", res.status, errBody);
      return { ok: false as const, error: `Google Calendar error ${res.status}: ${errBody}` };
    }
    return { ok: true as const };
  });
