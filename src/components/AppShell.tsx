import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { useIsConfigured } from "@/hooks/useIsConfigured";
import { cn } from "@/lib/utils";
import { signOut, isSupabaseConfigured } from "@/lib/auth";
import { createIPaymuPayment } from "@/lib/api/ipaymu.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { useStore, store } from "@/lib/dataStore";


const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
    pendo.clearSession();
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
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | null>(null);
  const { user } = useAuth();
  const demoMode = useStore((s) => s.demoMode);
  const isConfigured = useIsConfigured();

  const getWhatsAppLink = (plan: "starter" | "pro") => {
    const planName = plan === "starter" ? "Starter Plan" : "Pro Plan";
    const planPrice = plan === "starter" ? "Rp 99.000" : "Rp 199.000";
    const email = displayUser?.email || "—";
    const shopName = displayUser?.namaBisnis || "—";
    const userId = displayUser?.id || "—";
    
    const message = `Halo Admin CoolService, saya ingin melakukan pembayaran manual untuk upgrade paket *${planName}* (${planPrice}).

*Data Akun:*
- Email: ${email}
- Nama Usaha: ${shopName}
- User ID: ${userId}

Berikut saya sertakan bukti transfer pembayaran saya. Mohon dibantu aktivasi paketnya. Terima kasih!`;

    return `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
  };
  const displayUser = user || (!isConfigured ? {
    id: "demo-user-id",
    email: "demo@coolservice.com",
    nama: "Budi Santoso",
    namaBisnis: "CoolService Mandiri",
    noHp: "081234567890",
    subscriptionTier: "free" as const,
    subscriptionStatus: "active",
  } : null);

  const ipaymuFn = useServerFn(createIPaymuPayment);

  const handleUpgrade = async (plan: "starter" | "pro") => {
    if (!displayUser) {
      toast.error("Silakan masuk terlebih dahulu.");
      return;
    }
    setLoadingUpgrade(plan);
    try {
      if (!isConfigured) {
        // Mode demo: langsung upgrade di localStorage & reload secara lokal
        const updatedUser = {
          ...displayUser,
          subscriptionTier: plan,
          subscriptionStatus: "active",
        };
        localStorage.setItem("demo_user_profile", JSON.stringify(updatedUser));
        toast.success(`[Simulasi] Sukses meng-upgrade akun ke paket ${plan.toUpperCase()}!`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return;
      }

      // Secure mode: pass accessToken untuk memverifikasi session di server
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      const accessToken = session?.access_token || "";

      const res = await ipaymuFn({
        data: {
          planName: plan,
          origin: window.location.origin,
          accessToken,
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
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <Link
          to="/dashboard"
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

        {/* Demo Mode Toggle (Only for logged in users with Supabase configured) */}
        {isConfigured && user && (
          <div className="mx-2.5 my-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("size-2 rounded-full", demoMode ? "bg-amber-500 animate-pulse" : "bg-green-500")} />
                <span className="text-xs font-semibold text-sidebar-foreground">Mode Demo</span>
              </div>
              <button
                onClick={() => {
                  store.setDemoMode(!demoMode);
                  if (!demoMode) {
                    toast.info("Mode Demo diaktifkan");
                  } else {
                    toast.success("Kembali ke Data Anda");
                  }
                }}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  demoMode ? "bg-amber-500" : "bg-white/10"
                )}
                role="switch"
                aria-checked={demoMode}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    demoMode ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              {demoMode 
                ? "Menampilkan data simulasi lengkap untuk kebutuhan presentasi." 
                : "Menampilkan data riil milik toko Anda."}
            </p>
          </div>
        )}

        {/* Profile + Logout */}
        <div className="p-2.5 border-t border-sidebar-border space-y-1">
          {displayUser && (
            <Link
              to="/profil"
              className="block px-3 py-2.5 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent border border-transparent hover:border-border transition-all duration-150 mb-1 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-[10px] font-bold text-primary-foreground flex-shrink-0 group-hover:scale-105 transition-transform">
                  {(displayUser.nama || displayUser.email || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-sidebar-foreground truncate flex items-center justify-between">
                    <span className="truncate">{displayUser.nama || displayUser.email?.split("@")[0] || "Pengguna"}</span>
                    <ChevronRight className="size-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {displayUser.namaBisnis || "CoolService"}
                  </div>
                  
                  {/* Subscription Plan Badge */}
                  <div className="mt-1 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className={cn(
                      "inline-block text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded border",
                      displayUser.subscriptionTier === "pro"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : displayUser.subscriptionTier === "starter"
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                        : "bg-white/5 text-muted-foreground border-white/10"
                    )}>
                      {displayUser.subscriptionTier || "free"} Plan
                    </span>
                    {(displayUser.subscriptionTier === "free" || displayUser.subscriptionTier === "starter") && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowUpgrade(true);
                        }}
                        className="text-[10px] text-primary hover:text-primary-glow hover:underline font-semibold"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Upgrade Dialog */}
          <Dialog open={showUpgrade} onOpenChange={(val) => {
            setShowUpgrade(val);
            if (!val) setSelectedPlan(null);
          }}>
            <DialogContent className="max-w-xl bg-[#0f0f15] border-white/5 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Upgrade Akun CoolService Anda
                </DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {selectedPlan === null ? (
                  <>
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
                          onClick={() => setSelectedPlan("starter")}
                          disabled={displayUser?.subscriptionTier === "starter"}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg text-xs"
                        >
                          {displayUser?.subscriptionTier === "starter" ? "Plan Aktif" : "Pilih Starter"}
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
                          onClick={() => setSelectedPlan("pro")}
                          disabled={displayUser?.subscriptionTier === "pro"}
                          className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold text-xs"
                        >
                          {displayUser?.subscriptionTier === "pro" ? "Plan Aktif" : "Pilih Pro"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 text-[10px] text-gray-500 pt-2 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                      <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Pembayaran diproses dengan aman oleh iPaymu (Indonesia). Pembayaran instan mendukung QRIS, Virtual Account, dan Transfer Bank.</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <div>
                        <h4 className="font-bold text-sm text-white capitalize">{selectedPlan} Plan</h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedPlan === "starter" ? "Rp 99.000/bulan" : "Rp 199.000/bulan"}
                        </p>
                      </div>
                      <button 
                        onClick={() => setSelectedPlan(null)}
                        className="text-xs text-primary hover:text-primary-glow font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Kembali
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {/* Metode A: iPaymu */}
                      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                        <div>
                          <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-cyan-400" />
                            Pembayaran Otomatis (Instan)
                          </h5>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Mendukung QRIS, Virtual Account, dan Transfer Bank. Akun langsung aktif otomatis dalam 1 menit setelah transaksi sukses.
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleUpgrade(selectedPlan)}
                          disabled={loadingUpgrade !== null}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs py-2 h-auto"
                        >
                          {loadingUpgrade ? "Memproses..." : "Gunakan Pembayaran Otomatis"}
                        </Button>
                      </div>
                      
                      {/* Metode B: Manual Transfer */}
                      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.02] space-y-3">
                        <div>
                          <h5 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-amber-400" />
                            Transfer Bank Manual & Konfirmasi WA
                          </h5>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Pilihan cepat jika iPaymu sedang dalam pemeliharaan atau verifikasi. Transfer manual lalu kirim bukti transfer ke WhatsApp admin.
                          </p>
                        </div>
                        
                        <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-2 text-xs">
                          <div className="flex justify-between items-center text-gray-300">
                            <span>Bank BCA:</span>
                            <span className="font-mono font-bold text-white">8123456789</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-300">
                            <span>Bank Mandiri:</span>
                            <span className="font-mono font-bold text-white">1234567890123</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-300 border-t border-white/5 pt-1.5">
                            <span>Atas Nama:</span>
                            <span className="font-semibold text-white">CoolService Admin</span>
                          </div>
                          <div className="flex justify-between items-center text-amber-300 font-bold border-t border-dashed border-white/10 pt-1.5">
                            <span>Jumlah Transfer:</span>
                            <span>{selectedPlan === "starter" ? "Rp 99.000" : "Rp 199.000"}</span>
                          </div>
                        </div>

                        <a 
                          href={getWhatsAppLink(selectedPlan)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-extrabold text-xs py-3 rounded-md transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/20"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Konfirmasi via WhatsApp (Proses Cepat)
                        </a>
                      </div>
                    </div>
                  </div>
                )}
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
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="size-7 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground">
              <Snowflake className="size-3.5" />
            </div>
            <span className="font-bold text-sm">CoolService</span>
          </Link>
          <div className="size-9" />
        </header>

        {/* Demo Mode Top Banner */}
        {demoMode && (
          <div className="bg-gradient-to-r from-amber-600/15 via-amber-500/5 to-transparent border-b border-amber-500/20 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-amber-400 animate-pulse flex-shrink-0" />
              <span>
                <strong>Mode Demo Aktif:</strong> Menampilkan data simulasi lengkap. Ini berguna untuk presentasi atau uji coba fitur.
              </span>
            </div>
            {isConfigured && user && (
              <button
                onClick={() => {
                  store.setDemoMode(false);
                  toast.success("Beralih ke Data Riil");
                }}
                className="self-start sm:self-auto bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3 py-1 rounded-lg text-[10px] transition-all shadow-md shadow-amber-500/20 hover:scale-[1.02]"
              >
                Gunakan Data Saya
              </button>
            )}
          </div>
        )}

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
