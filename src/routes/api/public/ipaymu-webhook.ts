import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/api/ipaymu-admin.server";

export const Route = createFileRoute("/api/public/ipaymu-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          console.log("Received iPaymu Webhook Callback...");

          // Signature Verification (Mandatory)
          const env = typeof process !== "undefined" ? process.env : {};
          const apiKey = env.IPAYMU_API_KEY;
          const va = env.IPAYMU_VA;

          if (!apiKey || !va) {
            console.error("iPaymu webhook not configured: missing IPAYMU_API_KEY or IPAYMU_VA");
            return new Response(
              JSON.stringify({ status: "error", message: "Webhook not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          const incomingSignature = request.headers.get("signature") || "";
          const incomingTimestamp = request.headers.get("timestamp") || "";
          
          const rawBody = await request.clone().text();
          const crypto = await import("node:crypto");
          const bodyHash = crypto
            .createHash("sha256")
            .update(rawBody)
            .digest("hex")
            .toLowerCase();
          const stringToSign = `POST:${va}:${bodyHash}:${incomingTimestamp}`;
          const expectedSignature = crypto
            .createHmac("sha256", apiKey)
            .update(stringToSign)
            .digest("hex");

          if (incomingSignature !== expectedSignature) {
            console.warn("iPaymu Webhook Signature Verification FAILED!", {
              incoming: incomingSignature,
              expected: expectedSignature,
            });
            return new Response(JSON.stringify({ status: "error", message: "Invalid signature" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
          console.log("iPaymu Webhook Signature Verified Successfully!");
          
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

              // Validate planName against a strict allowlist to prevent
              // attackers from injecting arbitrary tier values via reference_id.
              const ALLOWED_PLANS = ["starter", "pro"] as const;
              if (!ALLOWED_PLANS.includes(planName as any)) {
                console.warn("Rejected webhook: invalid planName", planName);
                return new Response(JSON.stringify({ status: "error", message: "Invalid plan" }), {
                  status: 400,
                  headers: { "Content-Type": "application/json" },
                });
              }

              // Validate userId shape (UUID) before touching admin API
              if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
                console.warn("Rejected webhook: invalid userId", userId);
                return new Response(JSON.stringify({ status: "error", message: "Invalid user" }), {
                  status: 400,
                  headers: { "Content-Type": "application/json" },
                });
              }

              console.log(`Processing upgrade for user ${userId} to plan ${planName}...`);

              const adminClient = getSupabaseAdmin();
              if (adminClient) {
                // Store subscription state in app_metadata (server-only, not
                // editable by the end user) instead of user_metadata.
                const { error } = await adminClient.auth.admin.updateUserById(userId, {
                  app_metadata: {
                    subscription_tier: planName,
                    subscription_status: "active",
                    payment_date: new Date().toISOString(),
                    last_trx_id: trxId || null,
                  },
                });

                if (error) {
                  console.error("Supabase Admin update error:", error);
                  return new Response(JSON.stringify({ status: "error", message: error.message }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                  });
                }

                console.log(`Successfully upgraded user ${userId} app_metadata to plan ${planName}`);
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
