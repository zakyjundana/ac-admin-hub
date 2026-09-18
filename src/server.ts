import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// A client that navigates away mid-render aborts the socket (ECONNRESET).
// That is not an application failure and must not render the error page.
function isClientAbort(request: Request, error?: unknown): boolean {
  if (request.signal?.aborted) return true;
  const cause = (error as { cause?: unknown } | undefined)?.cause;
  const codes = [error, cause].map(
    (candidate) => (candidate as { code?: string; message?: string } | undefined)?.code,
  );
  if (codes.includes("ECONNRESET") || codes.includes("ECONNABORTED")) return true;
  const message = (error as { message?: string } | undefined)?.message ?? "";
  return message === "aborted" || message.includes("aborted");
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      if (response.status >= 500 && isClientAbort(request)) {
        return new Response(null, { status: 499 });
      }
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      if (isClientAbort(request, error)) {
        return new Response(null, { status: 499 });
      }
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
