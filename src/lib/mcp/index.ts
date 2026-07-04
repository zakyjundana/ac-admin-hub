import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listOrdersTool from "./tools/list-orders";
import createOrderTool from "./tools/create-order";
import listTechniciansTool from "./tools/list-technicians";
import listSparepartsTool from "./tools/list-spareparts";
import listHistoryTool from "./tools/list-history";

// Read at module init so it is inlined at build time. Falls back to a sentinel
// during the throwaway manifest-extract eval; the published build inlines the
// real ref.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "coolservice-mcp",
  title: "CoolService MCP",
  version: "0.1.0",
  instructions:
    "Tools untuk aplikasi CoolService (admin servis AC). Gunakan list_orders, create_order, list_technicians, list_spareparts, dan list_service_history untuk membaca dan membuat data milik pengguna yang sedang login.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listOrdersTool, createOrderTool, listTechniciansTool, listSparepartsTool, listHistoryTool],
});
