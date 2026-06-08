import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Sparkles, 
  Check, 
  CreditCard, 
  AlertCircle,
  Save,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile, isSupabaseConfigured } from "@/lib/auth";
import { createIPaymuPayment, checkOutboundIP } from "@/lib/api/ipaymu.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_app/profil")({
  head: () => ({ meta: [{ title: "Profil Bisnis — CoolService" }] }),
  component: ProfilPage,
});

function ProfilPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingUpgrade, setLoadingUpgrade] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    nama: "",
    namaBisnis: "",
    noHp: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        nama: user.nama || "",
        namaBisnis: user.namaBisnis || "",
        noHp: user.noHp || "",
      });
    }
  }, [user]);

  // Handle simulated / sandbox payment callbacks
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("payment") === "success") {
        const plan = params.get("plan");
        if (plan) {
          if (isSupabaseConfigured() && user) {
            import("@/lib/supabase").then(({ supabase }) => {
              supabase.auth.updateUser({
                data: {
                  subscription_tier: plan,
                  subscription_status: "active",
                }
              }).then(({ error }) => {
                if (error) {
                  toast.error("Gagal memperbarui paket langganan: " + error.message);
                } else {
                  toast.success(`Selamat! Akun Anda berhasil di-upgrade ke paket ${plan.toUpperCase()}`);
                  setTimeout(() => {
                    window.location.href = "/profil";
                  }, 2000);
                }
              });
            }).catch((err) => {
              console.error("Failed to load supabase module:", err);
            });
          } else {
            // Demo/mock mode simulation
            toast.success(`[Simulasi] Sukses meng-upgrade akun ke paket ${plan.toUpperCase()}!`);
            setTimeout(() => {
              window.location.href = "/profil";
            }, 2000);
          }
        }
      } else if (params.get("payment") === "cancel") {
        toast.error("Pembayaran dibatalkan.");
        setTimeout(() => {
          window.location.href = "/profil";
        }, 1500);
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.namaBisnis || !form.noHp) {
      toast.error("Semua kolom harus diisi!");
      return;
    }
    
    setLoading(true);
    try {
      await updateProfile({
        nama: form.nama,
        namaBisnis: form.namaBisnis,
        noHp: form.noHp,
      });
      toast.success("Profil bisnis berhasil diperbarui!");
      // Reload page to refresh auth state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui profil.");
    } finally {
      setLoading(false);
    }
  };

  const ipaymuFn = useServerFn(createIPaymuPayment);
  const checkIPFn = useServerFn(checkOutboundIP);
  const [outboundIP, setOutboundIP] = useState<string | null>(null);

  useEffect(() => {
    checkIPFn()
      .then((res: any) => {
        if (res.success && res.ip) {
          setOutboundIP(res.ip);
        } else {
          setOutboundIP("Gagal memuat IP");
        }
      })
      .catch(() => {
        setOutboundIP("Gagal memuat IP");
      });
  }, [checkIPFn]);

  const handleUpgrade = async (plan: "starter" | "pro") => {
    if (!user) {
      toast.error("Silakan masuk terlebih dahulu.");
      return;
    }
    setLoadingUpgrade(plan);
    try {
      const res = await ipaymuFn({
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <Toaster richColors position="top-right" />

      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Profil Bisnis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola data profil usaha servis AC dan pantau status paket langganan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              Detail Informasi Bisnis
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nama">Nama Lengkap Pemilik</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nama"
                      className="pl-9"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      placeholder="Contoh: Zaky Jundana"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="namaBisnis">Nama Bengkel Servis AC</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="namaBisnis"
                      className="pl-9"
                      value={form.namaBisnis}
                      onChange={(e) => setForm({ ...form, namaBisnis: e.target.value })}
                      placeholder="Contoh: CoolService Bandung"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="noHp">Nomor WhatsApp Bisnis</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="noHp"
                      className="pl-9"
                      value={form.noHp}
                      onChange={(e) => setForm({ ...form, noHp: e.target.value })}
                      placeholder="Contoh: 081234567890"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Terdaftar</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      id="email"
                      className="pl-9 bg-muted/40 text-muted-foreground cursor-not-allowed"
                      value={user?.email || ""}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-primary hover:bg-primary-glow text-primary-foreground font-semibold flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>

          {/* Plan Comparison */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Paket Langganan Pilihan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Starter Plan */}
              <div className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                user?.subscriptionTier === "starter" 
                  ? "border-cyan-500 bg-cyan-500/[0.02] shadow-md shadow-cyan-500/5" 
                  : "border-border bg-card/50"
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base">Starter Plan</h3>
                    {user?.subscriptionTier === "starter" && (
                      <span className="text-[10px] font-bold bg-cyan-500 text-black px-2 py-0.5 rounded-full uppercase">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5 mb-4">
                    <span className="text-2xl font-extrabold text-foreground">Rp 99.000</span>
                    <span className="text-xs text-muted-foreground">/bulan</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      Maksimal 3 Teknisi Lapangan
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      Manajemen Stok Spare Part
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      Zoning Wilayah Kerja
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      Laporan Keuangan Dasar
                    </li>
                  </ul>
                </div>
                <Button 
                  onClick={() => handleUpgrade("starter")}
                  disabled={loadingUpgrade !== null || user?.subscriptionTier === "starter"}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
                >
                  {loadingUpgrade === "starter" ? "Memproses..." : user?.subscriptionTier === "starter" ? "Plan Aktif" : "Pilih Starter"}
                </Button>
              </div>

              {/* Pro Plan */}
              <div className={`rounded-xl border p-5 flex flex-col justify-between relative overflow-hidden transition-all ${
                user?.subscriptionTier === "pro" 
                  ? "border-amber-500 bg-amber-500/[0.02] shadow-md shadow-amber-500/5" 
                  : "border-amber-500/30 bg-amber-500/[0.02]"
              }`}>
                <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-[9px] text-black font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Terpopuler
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base">Pro Plan</h3>
                    {user?.subscriptionTier === "pro" && (
                      <span className="text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full uppercase">
                        Aktif
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5 mb-4">
                    <span className="text-2xl font-extrabold text-foreground">Rp 199.000</span>
                    <span className="text-xs text-muted-foreground">/bulan</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      Teknisi Lapangan Tanpa Batas
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      Manajemen Garansi Otomatis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      Hitung Insentif & Rating Teknisi
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      Ekspor Laporan Keuangan ke PDF
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
          </div>
        </div>

        {/* Right Column: Status & Payment Information */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            
            {/* User Initials Avatar */}
            <div className="size-20 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-3xl font-extrabold text-primary-foreground shadow-lg shadow-primary/20 mb-4">
              {(user?.nama || user?.email || "?").slice(0, 1).toUpperCase()}
            </div>

            <h3 className="font-extrabold text-lg text-foreground truncate max-w-full">
              {user?.nama || "Pengguna CoolService"}
            </h3>
            <p className="text-xs text-muted-foreground truncate max-w-full mb-3">
              {user?.namaBisnis || "CoolService"}
            </p>

            {/* Plan Badge Large */}
            <div className="w-full bg-muted/30 border border-border rounded-xl p-4 mt-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Status Akun Saat Ini
              </span>
              
              <div className="flex items-center justify-center gap-2">
                <span className={`text-base font-extrabold uppercase px-3 py-1 rounded-lg border ${
                  user?.subscriptionTier === "pro"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-sm shadow-amber-500/5"
                    : user?.subscriptionTier === "starter"
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-sm shadow-cyan-500/5"
                    : "bg-muted text-muted-foreground border-border"
                }`}>
                  {user?.subscriptionTier || "free"} Plan
                </span>
              </div>
              
              <div className="mt-3 text-xs text-muted-foreground">
                {user?.subscriptionTier === "pro" ? (
                  <span>Akses tanpa batas ke seluruh modul fitur premium CoolService.</span>
                ) : user?.subscriptionTier === "starter" ? (
                  <span>Akses ke fitur esensial untuk mengelola hingga 3 teknisi.</span>
                ) : (
                  <span>Akun uji coba gratis dengan fitur manajemen servis dasar.</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Metode Pembayaran Aman
            </h3>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              Seluruh transaksi pembayaran untuk perpanjangan atau upgrade akun CoolService diproses secara instan melalui payment gateway berizin resmi <strong>iPaymu</strong>.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                Dukungan QRIS (Gopay, OVO, Dana, LinkAja)
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                Virtual Account Bank Mandiri, BNI, BRI, Permata
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                Pembayaran Instan & Otomatis Aktif
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-[10px] text-muted-foreground/60 bg-muted/20 p-2.5 rounded-lg border border-border">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Jika Anda mengalami kendala pembayaran, harap hubungi layanan bantuan kami.</span>
            </div>
          </div>

          {/* IP Outbound Info for iPaymu */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              IP Outbound Server (Untuk iPaymu)
            </h3>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              iPaymu memerlukan IP Outbound server Anda untuk whitelist penerimaan webhook callback notifikasi transaksi.
            </p>

            <div className="bg-muted/30 border border-border rounded-xl p-3 flex flex-col gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">Alamat IP Outbound:</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-foreground font-bold break-all">
                  {outboundIP || "Memuat..."}
                </span>
                {outboundIP && outboundIP !== "Gagal memuat IP" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(outboundIP);
                      toast.success("IP Outbound berhasil disalin!");
                    }}
                  >
                    Salin IP
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground/60 bg-muted/10 p-2.5 rounded-lg border border-border">
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span>IP ini diperoleh secara real-time dari server backend tempat aplikasi dijalankan saat ini. Silakan masukkan IP ini pada kolom "IP Website (IP Outbound Back-End)" di dashboard verifikasi iPaymu Anda.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
