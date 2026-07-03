import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

export const getSupabaseConfig = createServerFn({ method: "GET" }).handler(async () => {
  const env = typeof process !== "undefined" ? process.env : {};
  const url =
    env.SB_URL ||
    env.VITE_SB_URL ||
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    "";
  const anonKey =
    env.SB_ANON_KEY ||
    env.VITE_SB_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    "";
  return { url, anonKey };
});

export const checkServerSession = createServerFn({ method: "GET" }).handler(async () => {
  const headers = getRequestHeaders();
  const cookie = headers.get("cookie") || "";
  const isAuthenticated = cookie.includes("sb-session=active");
  return { isAuthenticated };
});

export const insertClientBooking = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      shopId: z.string().uuid().max(64),
      booking: z.object({
        nama_pelanggan: z.string().trim().min(1).max(100),
        no_wa: z.string().trim().min(6).max(20).regex(/^[0-9+\-\s()]+$/, "Nomor WA tidak valid"),
        alamat: z.string().trim().min(1).max(500),
        wilayah: z.string().trim().min(1).max(80),
        keluhan: z.string().trim().min(1).max(1000),
        status: z.string().max(30),
        teknisi_id: z.string().uuid().nullable(),
        tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
        jam: z.string().max(20),
      }),
    })
  )
  .handler(async ({ data }) => {
    const env = typeof process !== "undefined" ? process.env : {};
    const url =
      env.SB_URL ||
      env.VITE_SB_URL ||
      env.VITE_SUPABASE_URL ||
      env.SUPABASE_URL ||
      "";
    const serviceKey =
      env.SB_SERVICE_ROLE_KEY ||
      env.SUPABASE_SERVICE_ROLE_KEY ||
      "";

    if (!url || !serviceKey) {
      console.warn("Supabase credentials/service key not configured; skipping secure insert.");
      return { success: true, status: "sandbox_success" };
    }

    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(url, serviceKey, {
        auth: { persistSession: false }
      });

      // 1. Verify that shop actually exists in auth.users
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(data.shopId);
      if (userError || !userData?.user) {
        console.warn(`Booking blocked: shopId ${data.shopId} does not exist.`, userError);
        throw new Error("Toko tidak terdaftar atau belum aktif.");
      }

      // 2. Perform secure insert forcing default safe values for public client bookings
      const { error: insertError } = await supabaseAdmin
        .from("ac_orderan")
        .insert({
          nama_pelanggan: data.booking.nama_pelanggan,
          no_wa: data.booking.no_wa,
          alamat: data.booking.alamat,
          wilayah: data.booking.wilayah,
          keluhan: data.booking.keluhan,
          status: "Belum Selesai",
          teknisi_id: null,
          tanggal: data.booking.tanggal,
          jam: data.booking.jam,
          sumber: "Mandiri",
          user_id: data.shopId,
        });

      if (insertError) {
        console.error("Failed to insert booking securely:", insertError);
        throw new Error("Gagal membuat booking: " + insertError.message);
      }

      return { success: true };
    } catch (err: any) {
      console.error("Error in insertClientBooking handler:", err);
      throw err;
    }
  });

