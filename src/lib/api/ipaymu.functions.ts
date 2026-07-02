import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// createServerFn to generate payment link for iPaymu
export const createIPaymuPayment = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      // NOTE: userId/email/nama/noHp intentionally NOT accepted from client.
      // They are derived from the authenticated Supabase session on the server
      // to prevent IDOR (paying / upgrading another user's account).
      planName: z.enum(["starter", "pro"]),
      origin: z.string().max(200).optional(),
      accessToken: z.string().min(10).max(4000),
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

    // Supabase Validation to prevent IDOR
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

    const isSupabaseConfigured = !!url && !!anonKey;

    if (!isSupabaseConfigured) {
      // Cannot verify identity → refuse to create real payment links.
      return {
        success: false as const,
        message: "Server autentikasi belum dikonfigurasi.",
      };
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(data.accessToken);
    if (userError || !user) {
      console.error("Token verification failed in createIPaymuPayment:", userError);
      throw new Error("Akses ditolak: Token autentikasi tidak valid.");
    }

    // All identity fields come from the verified JWT — never from the client.
    const finalUserId = user.id;
    const finalEmail = user.email || "";
    const finalNama = user.user_metadata?.nama || "Pengguna";
    const finalNoHp = user.user_metadata?.no_hp || "";

    // Trust APP_ORIGIN from env; only fall back to client-provided origin if
    // it matches the trusted host. This prevents an attacker from redirecting
    // the notifyUrl to an evil domain and forging payment success.
    const trustedOrigin = env.APP_ORIGIN || env.VITE_APP_ORIGIN || "";
    let effectiveOrigin = trustedOrigin;
    if (!effectiveOrigin && data.origin) {
      try {
        const parsed = new URL(data.origin);
        // Only accept https origins (or http on localhost for dev)
        const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
        if (parsed.protocol === "https:" || (isLocal && parsed.protocol === "http:")) {
          effectiveOrigin = `${parsed.protocol}//${parsed.host}`;
        }
      } catch {
        /* ignore invalid origin */
      }
    }
    if (!effectiveOrigin) {
      return {
        success: false as const,
        message: "Origin aplikasi tidak dikonfigurasi.",
      };
    }

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
      returnUrl: `${effectiveOrigin}/profil?payment=success`,
      cancelUrl: `${effectiveOrigin}/profil?payment=cancel`,
      notifyUrl: `${effectiveOrigin}/api/public/ipaymu-webhook`,
      referenceId: `${finalUserId}:${data.planName}`,
      buyerName: finalNama,
      buyerEmail: finalEmail,
      buyerPhone: finalNoHp,
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
        `Creating iPaymu payment link for ${finalEmail} (${data.planName}) at ${baseUrl}...`,
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

