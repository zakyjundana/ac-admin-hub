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
    const process = await import("node:process");

    const apiKey = process.env.IPAYMU_API_KEY || "sandbox-api-key";
    const va = process.env.IPAYMU_VA || "0000007890123456";
    const isSandbox =
      process.env.IPAYMU_SANDBOX === "true" ||
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
      notifyUrl: `${data.origin}/api/ipaymu-webhook`,
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
        .replace(/\.\d{3}/, "");
      const stringToSign = `POST:${va}:${bodyHash}:${timestamp}`;
      const signature = crypto
        .createHmac("sha256", apiKey)
        .update(stringToSign)
        .digest("hex");

      console.log(
        `Creating iPaymu payment link for ${data.email} (${data.planName}) at ${baseUrl}...`,
      );

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

      const resData: any = await response.json();
      console.log("iPaymu Response:", resData);

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
