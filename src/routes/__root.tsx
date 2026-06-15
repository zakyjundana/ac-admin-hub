import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CoolService - Dashboard Bisnis Service AC" },
      { name: "description", content: "Dashboard admin service AC untuk kelola jadwal teknisi, zoning wilayah, potong stok sparepart otomatis, hitung insentif harian, & integrasi WhatsApp." },
      { name: "author", content: "CoolService" },
      { property: "og:title", content: "CoolService - Dashboard Bisnis Service AC" },
      { property: "og:description", content: "Dashboard admin service AC untuk kelola jadwal teknisi, zoning wilayah, potong stok sparepart otomatis, hitung insentif harian, & integrasi WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@CoolService" },
      { name: "twitter:title", content: "CoolService - Dashboard Bisnis Service AC" },
      { name: "twitter:description", content: "Dashboard admin service AC untuk kelola jadwal teknisi, zoning wilayah, potong stok sparepart otomatis, hitung insentif harian, & integrasi WhatsApp." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e84d5774-0485-453a-9c1a-44b9584c1315" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e84d5774-0485-453a-9c1a-44b9584c1315" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  beforeLoad: async () => {
    // If we're on the client side and Supabase has not been marked as configured,
    // fetch the configuration from the server environment.
    if (typeof window !== "undefined") {
      const { isSupabaseConfigured, setRuntimeConfigured } = await import("@/lib/auth");
      if (!isSupabaseConfigured()) {
        try {
          const { getSupabaseConfig } = await import("@/lib/api/config.functions");
          const { initializeSupabase } = await import("@/lib/supabase");
          
          const config = await getSupabaseConfig();
          if (config.url && config.anonKey) {
            initializeSupabase(config.url, config.anonKey);
            setRuntimeConfigured(true);
            console.log("[Root] Dynamically initialized Supabase config on client.");
          }
        } catch (err) {
          console.warn("Failed to fetch runtime supabase config in root beforeLoad:", err);
        }
      }
    }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
