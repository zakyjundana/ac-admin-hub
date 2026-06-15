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
      shopId: z.string(),
      booking: z.object({
        nama_pelanggan: z.string(),
        no_wa: z.string(),
        alamat: z.string(),
        wilayah: z.string(),
        keluhan: z.string(),
        status: z.string(),
        teknisi_id: z.string().nullable(),
        tanggal: z.string(),
        jam: z.string(),
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

      // 1. Verify that shopId actually exists by checking if there's any teknisi associated with it
      // This confirms they are a valid registered shop in the system.
      const { data: activeShop, error: checkError } = await supabaseAdmin
        .from("ac_teknisi")
        .select("id")
        .eq("user_id", data.shopId)
        .limit(1);

      if (checkError) {
        console.error("Failed to verify shop validation in Supabase:", checkError);
        throw new Error("Gagal memverifikasi toko.");
      }

      if (!activeShop || activeShop.length === 0) {
        console.warn(`Booking blocked: shopId ${data.shopId} is not a valid registered shop.`);
        throw new Error("Toko tidak terdaftar atau belum aktif.");
      }

      // 2. Perform secure insert
      const { error: insertError } = await supabaseAdmin
        .from("ac_orderan")
        .insert({
          nama_pelanggan: data.booking.nama_pelanggan,
          no_wa: data.booking.no_wa,
          alamat: data.booking.alamat,
          wilayah: data.booking.wilayah,
          keluhan: data.booking.keluhan,
          status: data.booking.status,
          teknisi_id: data.booking.teknisi_id,
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
