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
  name: "list_spareparts",
  title: "Daftar stok spare part",
  description:
    "Ambil daftar spare part beserta stok saat ini. Aktifkan low_stock_only=true untuk hanya menampilkan item yang stoknya di bawah stok minimum.",
  inputSchema: {
    low_stock_only: z.boolean().default(false),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ low_stock_only, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Tidak terautentikasi." }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("ac_spareparts")
      .select("id,nama,kategori,satuan,stok,stok_minimum,harga")
      .eq("user_id", ctx.getUserId())
      .order("nama", { ascending: true })
      .limit(limit);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const filtered = low_stock_only ? (data ?? []).filter((r) => r.stok <= r.stok_minimum) : data;
    return {
      content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }],
      structuredContent: { spareparts: filtered },
    };
  },
});
