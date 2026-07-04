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
  name: "list_service_history",
  title: "Riwayat servis selesai",
  description:
    "Ambil riwayat servis AC yang sudah selesai, urut dari terbaru. Berisi jenis kerusakan, tindakan, biaya, dan tanggal selesai.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Tidak terautentikasi." }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("ac_riwayat")
      .select("id,nama_pelanggan,alamat,jenis_kerusakan,tindakan,teknisi_id,tanggal_selesai,garansi_hari,biaya")
      .eq("user_id", ctx.getUserId())
      .order("tanggal_selesai", { ascending: false })
      .limit(limit);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { history: data },
    };
  },
});
