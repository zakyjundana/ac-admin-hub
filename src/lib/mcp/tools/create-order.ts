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
  name: "create_order",
  title: "Buat orderan servis AC",
  description:
    "Buat satu orderan servis AC baru untuk pengguna yang sedang login. Gunakan format tanggal YYYY-MM-DD dan jam HH:MM (24 jam).",
  inputSchema: {
    nama_pelanggan: z.string().trim().min(1).max(100),
    no_wa: z.string().trim().min(6).max(20),
    alamat: z.string().trim().min(1).max(500),
    wilayah: z.string().trim().min(1).max(80),
    keluhan: z.string().trim().min(1).max(1000),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
    jam: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM").default("09:00"),
    teknisi_id: z.string().optional().describe("ID teknisi yang ditugaskan (opsional)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Tidak terautentikasi." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("ac_orderan")
      .insert({
        user_id: ctx.getUserId(),
        nama_pelanggan: input.nama_pelanggan,
        no_wa: input.no_wa,
        alamat: input.alamat,
        wilayah: input.wilayah,
        keluhan: input.keluhan,
        status: "Belum Selesai",
        tanggal: input.tanggal,
        jam: input.jam,
        teknisi_id: input.teknisi_id ?? null,
        sumber: "MCP",
      })
      .select()
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Orderan dibuat dengan id ${data.id}` }],
      structuredContent: { order: data },
    };
  },
});
