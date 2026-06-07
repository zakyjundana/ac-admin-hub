import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Calendar,
  Users,
  ClipboardList,
  Snowflake,
  Menu,
  X,
  Package,
  ShieldCheck,
  Coins,
  LayoutDashboard,
  Star,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signOut, isSupabaseConfigured } from "@/lib/auth";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orderan", label: "Orderan", icon: ClipboardList },
  { to: "/jadwal", label: "Jadwal", icon: Calendar },
  { to: "/teknisi", label: "Teknisi", icon: Users },
  { to: "/stok", label: "Stok Spare Part", icon: Package },
  { to: "/riwayat", label: "Riwayat & Garansi", icon: ShieldCheck },
  { to: "/keuangan", label: "Keuangan & Insentif", icon: Coins },
  { to: "/rating", label: "Rating & Feedback", icon: Star },
] as const;

async function handleLogout() {
  try {
    if (isSupabaseConfigured()) await signOut();
    window.location.href = "/login";
  } catch {
    window.location.href = "/login";
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0 lg:static",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="group flex items-center gap-3 px-5 py-4 border-b border-sidebar-border hover:bg-sidebar-accent transition-colors"
        >
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground shadow-md shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
            <Snowflake className="size-4.5" />
          </div>
          <div>
            <div className="font-bold text-sm text-sidebar-foreground leading-tight">CoolService</div>
            <div className="text-[11px] text-muted-foreground">Admin Dashboard</div>
          </div>
          <ChevronRight className="ml-auto size-3.5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
        </Link>

        {/* Nav */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 pt-2 pb-1.5">
            Menu Utama
          </p>
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground",
                )}
              >
                <Icon className={cn("size-4 flex-shrink-0 transition-transform group-hover:scale-110", active && "text-primary-foreground")} />
                <span className="truncate">{item.label}</span>
                {active && <div className="ml-auto w-1 h-1 rounded-full bg-primary-foreground/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Logout */}
        <div className="p-2.5 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="size-4" />
            <span>Keluar</span>
          </button>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
            © 2026 CoolService
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-accent text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground">
              <Snowflake className="size-3.5" />
            </div>
            <span className="font-bold text-sm">CoolService</span>
          </Link>
          <div className="size-9" />
        </header>

        <main className="flex-1 p-4 lg:p-6 xl:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export function ShellRoute() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
