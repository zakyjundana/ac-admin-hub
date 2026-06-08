import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/api/ipaymu.server";

export const Route = createFileRoute("/api/ipaymu-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          console.log("Received iPaymu Webhook Callback...");
          
          let referenceId = "";
          let statusCode = "";
          let status = "";
          let trxId = "";

          // iPaymu can send either application/json or application/x-www-form-urlencoded
          const contentType = request.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const body = await request.json();
            referenceId = body.reference_id || "";
            statusCode = String(body.status_code || "");
            status = body.status || "";
            trxId = body.trx_id || "";
          } else {
            const formData = await request.formData();
            referenceId = String(formData.get("reference_id") || "");
            statusCode = String(formData.get("status_code") || "");
            status = String(formData.get("status") || "");
            trxId = String(formData.get("trx_id") || "");
          }

          console.log("Webhook data parsed:", { referenceId, statusCode, status, trxId });

          // status_code = 1 means success / paid, status = "berhasil"
          if ((statusCode === "1" || status === "berhasil") && referenceId) {
            const parts = referenceId.split(":");
            if (parts.length === 2) {
              const [userId, planName] = parts;
              console.log(`Processing upgrade for user ${userId} to plan ${planName}...`);

              const adminClient = getSupabaseAdmin();
              if (adminClient) {
                // Update user metadata in auth.users
                const { error } = await adminClient.auth.admin.updateUserById(userId, {
                  user_metadata: {
                    subscription_tier: planName,
                    subscription_status: "active",
                    payment_date: new Date().toISOString(),
                  },
                });

                if (error) {
                  console.error("Supabase Admin update error:", error);
                  return new Response(JSON.stringify({ status: "error", message: error.message }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                  });
                }

                console.log(`Successfully upgraded user ${userId} metadata to plan ${planName}`);
              } else {
                console.warn("Supabase admin client is not available (missing service role key).");
              }
            } else {
              console.warn("Invalid reference_id format:", referenceId);
            }
          } else {
            console.log("Transaction status is not successful or reference_id is missing.");
          }

          // Always return 200 OK to iPaymu to prevent retries
          return new Response(JSON.stringify({ status: "success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("Webhook processing failed:", error);
          return new Response(JSON.stringify({ status: "error", message: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
