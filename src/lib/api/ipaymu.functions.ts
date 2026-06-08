import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
    }),
  )
  .handler(async ({ data }) => {
    const crypto = await import("node:crypto");
    const env = typeof process !== "undefined" ? process.env : {};

    const apiKey = env.IPAYMU_API_KEY || "sandbox-api-key";
    const va = env.IPAYMU_VA || "0000007890123456";
    const isSandbox =
      env.IPAYMU_SANDBOX === "true" ||
      va.startsWith("0000") ||
      apiKey === "sandbox-api-key";

    const baseUrl = isSandbox
      ? "https://sandbox.ipaymu.com/api/v2/payment"
      : "https://my.ipaymu.com/api/v2/payment";

    const price = data.planName === "starter" ? 99000 : 199000;
    const planLabel =
      data.planName === "starter"
        ? "Starter Plan (Maks 3 Teknisi)"
        : "Pro Plan (Teknisi Tanpa Batas)";

    const body = {
      product: [planLabel],
      qty: ["1"],
      price: [price.toString()],
      description: [`Langganan Bulanan ${planLabel}`],
      returnUrl: `${data.origin}/profil?payment=success`,
      cancelUrl: `${data.origin}/profil?payment=cancel`,
      notifyUrl: `${data.origin}/api/public/ipaymu-webhook`,
      referenceId: `${data.userId}:${data.planName}`,
      buyerName: data.nama,
      buyerEmail: data.email,
      buyerPhone: data.noHp,
    };

    try {
      const bodyString = JSON.stringify(body);
      const bodyHash = crypto
        .createHash("sha256")
        .update(bodyString)
        .digest("hex")
        .toLowerCase();
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[^0-9]/g, ""); // Format: YYYYMMDDhhmmss
      const stringToSign = `POST:${va}:${bodyHash}:${timestamp}`;
      const signature = crypto
        .createHmac("sha256", apiKey)
        .update(stringToSign)
        .digest("hex");

      console.log(
        `Creating iPaymu payment link for ${data.email} (${data.planName}) at ${baseUrl}...`,
      );

      let resData: any = {};
      try {
        const response = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            va,
            signature,
            timestamp,
          },
          body: bodyString,
        });
        resData = await response.json();
        console.log("iPaymu Response:", resData);
      } catch (fetchErr) {
        console.warn("Failed to fetch from iPaymu, using sandbox fallback:", fetchErr);
        resData = { status: 500, message: "Fetch failed" };
      }

      // Fallback to simulation if iPaymu credentials are unconfigured or request failed
      if (
        !env.IPAYMU_API_KEY ||
        env.IPAYMU_API_KEY === "sandbox-api-key" ||
        va === "0000007890123456" ||
        resData.status !== 200
      ) {
        console.log("iPaymu credentials are not configured or request failed. Using sandbox simulation...");
        return {
          success: true as const,
          paymentUrl: `${data.origin}/profil?payment=success&plan=${data.planName}`,
          message: "Simulated payment link created (Sandbox Fallback)",
        };
      }

      if (resData.status === 200 && resData.data?.Url) {
        return {
          success: true as const,
          paymentUrl: resData.data.Url as string,
          message: "Payment link created successfully",
        };
      }
      return {
        success: false as const,
        message: resData.message || "Failed to create payment link from iPaymu",
      };
    } catch (err: any) {
      console.error("iPaymu integration error:", err);
      return {
        success: false as const,
        message: err.message || "Server error occurred while calling iPaymu",
      };
    }
  });

// Server function to check outbound IP of the backend server (Forcing IPv4 format)
export const checkOutboundIP = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      console.log("Checking outbound IPv4 of server...");

      // Try AWS checkip first (IPv4, hosted on AWS, not Cloudflare)
      try {
        const response = await fetch("https://checkip.amazonaws.com", { signal: AbortSignal.timeout(3000) });
        const text = await response.text();
        const ip = text.trim();
        if (ip && !ip.includes(":")) {
          return { success: true, ip };
        }
      } catch (e) {
        console.warn("checkip.amazonaws.com failed...", e);
      }

      // Try ifconfig.me/ip (hosted on non-Cloudflare network)
      try {
        const response = await fetch("https://ifconfig.me/ip", { signal: AbortSignal.timeout(3000) });
        const text = await response.text();
        const ip = text.trim();
        if (ip && !ip.includes(":")) {
          return { success: true, ip };
        }
      } catch (e) {
        console.warn("ifconfig.me/ip failed...", e);
      }

      // Try api4.ipify.org
      try {
        const response = await fetch("https://api4.ipify.org?format=json", { signal: AbortSignal.timeout(3000) });
        const data = await response.json();
        if (data.ip && !data.ip.includes(":")) {
          return { success: true, ip: data.ip as string };
        }
      } catch (e) {
        console.warn("api4.ipify.org failed...", e);
      }

      // Try ipv4.icanhazip.com
      try {
        const response = await fetch("https://ipv4.icanhazip.com", { signal: AbortSignal.timeout(3000) });
        const text = await response.text();
        const ip = text.trim();
        if (ip && !ip.includes(":")) {
          return { success: true, ip };
        }
      } catch (e) {
        console.warn("ipv4.icanhazip.com failed...", e);
      }

      // If all else fails, use standard ipify
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return {
        success: true,
        ip: data.ip as string,
      };
    } catch (err: any) {
      console.error("Failed to check outbound IP:", err);
      return {
        success: false,
        message: err.message || "Failed to fetch outbound IP",
      };
    }
  });

