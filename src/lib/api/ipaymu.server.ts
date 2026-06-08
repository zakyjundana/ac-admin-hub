import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "node:crypto";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

// Helper to get Supabase Admin Client (runs only on server)
export function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SB_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
  if (!serviceRole) {
    console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY / SB_SERVICE_ROLE_KEY is not configured. Database updates will be skipped.");
    return null;
  }
  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Generate iPaymu Signature
function generateSignature(method: string, va: string, body: any, apiKey: string): { signature: string; timestamp: string } {
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", "").replace(/[-:]/g, ""); // Format: YYYYMMDDHHMMSS or similar
  const timestampHeader = new Date().toISOString().replace(/\.\d{3}/, ""); // standard ISO 8601 standard
  // Standard iPaymu timestamp is YYYYMMDDHHMMSS or standard ISO 8601. Standard ISO is accepted.
  // Actually, standard timestamp matches ISO 8601 without ms: YYYY-MM-DDTHH:MM:SS
  const bodyString = JSON.stringify(body);
  const bodyHash = crypto.createHash("sha256").update(bodyString).digest("hex").toLowerCase();
  
  const stringToSign = `${method.toUpperCase()}:${va}:${bodyHash}:${timestampHeader}`;
  const signature = crypto.createHmac("sha256", apiKey).update(stringToSign).digest("hex");
  
  return { signature, timestamp: timestampHeader };
}

// createServerFn to generate payment link for iPaymu
export const createIPaymuPayment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string(),
      email: z.string(),
      nama: z.string(),
      noHp: z.string(),
      planName: z.enum(["starter", "pro"]),
      origin: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.IPAYMU_API_KEY || "sandbox-api-key";
    const va = process.env.IPAYMU_VA || "0000007890123456"; // sandbox default / fallback
    const isSandbox = process.env.IPAYMU_SANDBOX === "true" || va.startsWith("0000") || apiKey === "sandbox-api-key";
    
    const baseUrl = isSandbox 
      ? "https://sandbox.ipaymu.com/api/v2/payment"
      : "https://my.ipaymu.com/api/v2/payment";

    const price = data.planName === "starter" ? 99000 : 199000;
    const planLabel = data.planName === "starter" ? "Starter Plan (Maks 3 Teknisi)" : "Pro Plan (Teknisi Tanpa Batas)";

    // iPaymu redirect payment link payload format
    const body = {
      product: [planLabel],
      qty: ["1"],
      price: [price.toString()],
      description: [`Langganan Bulanan ${planLabel}`],
      returnUrl: `${data.origin}/dashboard?payment=success`,
      cancelUrl: `${data.origin}/dashboard?payment=cancel`,
      notifyUrl: `${data.origin}/api/ipaymu-webhook`,
      referenceId: `${data.userId}:${data.planName}`,
      buyerName: data.nama,
      buyerEmail: data.email,
      buyerPhone: data.noHp,
    };

    try {
      console.log(`Creating iPaymu payment link for ${data.email} (${data.planName}) at ${baseUrl}...`);
      const { signature, timestamp } = generateSignature("POST", va, body, apiKey);

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "va": va,
          "signature": signature,
          "timestamp": timestamp,
        },
        body: JSON.stringify(body),
      });

      const resData: any = await response.json();
      console.log("iPaymu Response:", resData);

      if (resData.status === 200 && resData.data?.Url) {
        return {
          success: true,
          paymentUrl: resData.data.Url,
          message: "Payment link created successfully",
        };
      } else {
        return {
          success: false,
          message: resData.message || "Failed to create payment link from iPaymu",
        };
      }
    } catch (err: any) {
      console.error("iPaymu integration error:", err);
      return {
        success: false,
        message: err.message || "Server error occurred while calling iPaymu",
      };
    }
  });
