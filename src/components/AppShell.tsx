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
  CreditCard,
  Check,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { signOut, isSupabaseConfigured } from "@/lib/auth";
import { createIPaymuPayment } from "@/lib/api/ipaymu.server";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";

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
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loadingUpgrade, setLoadingUpgrade] = useState<string | null>(null);
  const { user } = useAuth();

  const handleUpgrade = async (plan: "starter" | "pro") => {
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu.");
      return;
    }
    setLoadingUpgrade(plan);
    try {
      const res = await createIPaymuPayment({
        data: {
          userId: user.id,
          email: user.email || "",
          nama: user.nama || "Pengguna",
          noHp: user.noHp || "",
          planName: plan,
          origin: window.location.origin,
        },
      });

      if (res.success && res.paymentUrl) {
        toast.success("Mengarahkan ke halaman pembayaran iPaymu...");
        window.location.href = res.paymentUrl;
      } else {
        toast.error(res.message || "Gagal membuat link pembayaran.");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi.");
    } finally {
      setLoadingUpgrade(null);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Toaster richColors position="top-right" />
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

        {/* Profile + Logout */}
        <div className="p-2.5 border-t border-sidebar-border space-y-1">
          {user && (
            <div className="px-3 py-2.5 rounded-lg bg-sidebar-accent/50 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0">
                  {(user.nama || user.email || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-sidebar-foreground truncate">
                    {user.nama || user.email?.split("@")[0] || "Pengguna"}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {user.namaBisnis || "CoolService"}
                  </div>
                  
                  {/* Subscription Plan Badge */}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={cn(
                      "inline-block text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded border",
                      user.subscriptionTier === "pro"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : user.subscriptionTier === "starter"
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                        : "bg-white/5 text-muted-foreground border-white/10"
                    )}>
                      {user.subscriptionTier || "free"} Plan
                    </span>
                    {(user.subscriptionTier === "free" || user.subscriptionTier === "starter") && (
                      <button 
                        onClick={() => setShowUpgrade(true)}
                        className="text-[10px] text-primary hover:text-primary-glow hover:underline font-semibold"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upgrade Dialog */}
          <Dialog open={showUpgrade} onOpenChange={setShowUpgrade}>
            <DialogContent className="max-w-xl bg-[#0f0f15] border-white/5 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Upgrade Akun CoolService Anda
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-sm text-gray-400">
                  Pilih paket langganan terbaik untuk mendukung skala operasional bengkel servis AC Anda secara maksimal.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Starter Plan */}
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm">Starter Plan</h4>
                        <span className="text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full">3 Teknisi</span>
                      </div>
                      <div className="flex items-baseline gap-0.5 mb-4">
                        <span className="text-xl font-extrabold text-white">Rp 99.000</span>
                        <span className="text-xs text-gray-500">/bulan</span>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-300 mb-6">
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                          Manajemen Stok Spare Part
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                          Zoning Wilayah Kerja
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                          Laporan Keuangan Dasar
                        </li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => handleUpgrade("starter")}
                      disabled={loadingUpgrade !== null || user?.subscriptionTier === "starter"}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg text-xs"
                    >
                      {loadingUpgrade === "starter" ? "Memproses..." : user?.subscriptionTier === "starter" ? "Plan Aktif" : "Pilih Starter"}
                    </Button>
                  </div>

                  {/* Pro Plan */}
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] p-5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-[9px] text-black font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Populer
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm">Pro Plan</h4>
                        <span className="text-[10px] font-semibold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">Unlimited</span>
                      </div>
                      <div className="flex items-baseline gap-0.5 mb-4">
                        <span className="text-xl font-extrabold text-white">Rp 199.000</span>
                        <span className="text-xs text-gray-500">/bulan</span>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-300 mb-6">
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                          Semua fitur Starter
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                          Manajemen Garansi Otomatis
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                          Insentif & Rating Teknisi
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                          Ekspor Laporan ke PDF
                        </li>
                      </ul>
                    </div>
                    <Button 
                      onClick={() => handleUpgrade("pro")}
                      disabled={loadingUpgrade !== null || user?.subscriptionTier === "pro"}
                      className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold text-xs"
                    >
                      {loadingUpgrade === "pro" ? "Memproses..." : user?.subscriptionTier === "pro" ? "Plan Aktif" : "Pilih Pro"}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 text-[10px] text-gray-500 pt-2 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                  <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Pembayaran diproses dengan aman oleh iPaymu (Indonesia). Pembayaran instan mendukung QRIS, Virtual Account, dan Transfer Bank.</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="size-4" />
            <span>Keluar</span>
          </button>
          <p className="text-[10px] text-muted-foreground/40 text-center pt-1">
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
