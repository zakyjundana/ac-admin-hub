import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_orders",
  title: "Daftar orderan servis AC",
  description:
    "Ambil daftar orderan servis AC milik pengguna. Bisa difilter berdasarkan status (Belum Selesai, Dalam Pengerjaan, Selesai) dan jumlah maksimum baris.",
  inputSchema: {
    status: z
      .enum(["Belum Selesai", "Dalam Pengerjaan", "Selesai"])
      .optional()
      .describe("Filter status orderan."),
    limit: z.number().int().min(1).max(100).default(20).describe("Jumlah baris maksimum."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Tidak terautentikasi." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("ac_orderan")
      .select("id,nama_pelanggan,no_wa,alamat,wilayah,keluhan,status,teknisi_id,tanggal,jam,sumber,created_at")
      .eq("user_id", ctx.getUserId())
      .order("tanggal", { ascending: false })
      .limit(limit);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { orders: data },
    };
  },
});
