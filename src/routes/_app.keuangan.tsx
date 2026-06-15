import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { 
  TrendingUp, 
  Coins, 
  Users, 
  CalendarDays, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  Wallet,
  Activity,
  Plus,
  Trash2,
  Info,
  FileText,
  Settings
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { useStore, store } from "@/lib/dataStore";
import { type Orderan, type SparePart, type Pengeluaran } from "@/lib/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/keuangan")({
  head: () => ({ meta: [{ title: "Keuangan & Insentif — CoolService" }] }),
  component: KeuanganPage,
});

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function KeuanganPage() {
  const orderan = useStore((s) => s.orderan);
  const teknisi = useStore((s) => s.teknisi);
  const sparepart = useStore((s) => s.sparepart);
  const pengeluaran = useStore((s) => s.pengeluaran);
  const demoMode = useStore((s) => s.demoMode);

  // States
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-06"); // Format YYYY-MM
  const [activeTab, setActiveTab] = useState<"ringkasan" | "catatan">("ringkasan");

  // State for adding new manual operational expense
  const [formEx, setFormEx] = useState({
    kategori: "Transport & Bensin",
    jumlah: "",
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: "",
  });

  const handleAddEx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEx.jumlah || Number(formEx.jumlah) <= 0) {
      toast.error("Jumlah pengeluaran harus diisi dan lebih besar dari 0");
      return;
    }
    if (!formEx.keterangan.trim()) {
      toast.error("Keterangan pengeluaran harus diisi");
      return;
    }

    await store.addPengeluaran({
      kategori: formEx.kategori,
      jumlah: Number(formEx.jumlah),
      tanggal: formEx.tanggal,
      keterangan: formEx.keterangan,
    });

    toast.success("Catatan pengeluaran berhasil ditambahkan!");
    setFormEx({
      kategori: "Transport & Bensin",
      jumlah: "",
      tanggal: new Date().toISOString().slice(0, 10),
      keterangan: "",
    });
  };

  const handleDeleteEx = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan pengeluaran ini?")) {
      await store.deletePengeluaran(id);
      toast.success("Catatan pengeluaran berhasil dihapus");
    }
  };

  // Helper classification & calculations
  const isCuci = (keluhan: string) => {
    const k = keluhan.toLowerCase();
    return k.includes("cuci") || k.includes("cleaning") || k.includes("clean") || k.includes("perawatan");
  };

  const getIncentive = (keluhan: string) => {
    return isCuci(keluhan) ? 50000 : 100000;
  };

  const getOrderRevenue = (o: Orderan) => {
    const serviceFee = isCuci(o.keluhan) ? 75000 : 250000;
    let partsFee = 0;
    if (o.spare_parts) {
      for (const p of o.spare_parts) {
        const sp = sparepart.find((item) => item.id === p.sparepart_id);
        if (sp) {
          partsFee += sp.harga * p.qty;
        }
      }
    }
    return serviceFee + partsFee;
  };

  const getOrderPartsCost = (o: Orderan) => {
    let cost = 0;
    if (o.spare_parts) {
      for (const p of o.spare_parts) {
        const sp = sparepart.find((item) => item.id === p.sparepart_id);
        if (sp) {
          cost += sp.harga * p.qty;
        }
      }
    }
    return cost;
  };

  // 1. Calculations for Daily Incentives
  const dailyOrders = useMemo(() => {
    return orderan.filter((o) => o.status === "Selesai" && o.tanggal === selectedDate);
  }, [orderan, selectedDate]);

  const dailyIncentives = useMemo(() => {
    return teknisi.map((t) => {
      const orders = dailyOrders.filter((o) => o.teknisi_id === t.id);
      const cuciCount = orders.filter((o) => isCuci(o.keluhan)).length;
      const perbaikanCount = orders.length - cuciCount;
      const totalIncentive = (cuciCount * 50000) + (perbaikanCount * 100000);

      return {
        ...t,
        cuci: cuciCount,
        perbaikan: perbaikanCount,
        total: totalIncentive,
      };
    });
  }, [teknisi, dailyOrders]);

  // 2. Calculations for Monthly Salary Recap (selectedMonth: e.g. "2026-06")
  const monthlyCompletedOrders = useMemo(() => {
    return orderan.filter((o) => o.status === "Selesai" && o.tanggal.startsWith(selectedMonth));
  }, [orderan, selectedMonth]);

  const monthlySalaryRecap = useMemo(() => {
    const basicSalary = 3500000; // Rp 3.500.000 basic salary
    return teknisi.map((t) => {
      const orders = monthlyCompletedOrders.filter((o) => o.teknisi_id === t.id);
      const totalIncentive = orders.reduce((sum, o) => sum + getIncentive(o.keluhan), 0);
      return {
        id: t.id,
        nama: t.nama,
        pokok: basicSalary,
        insentif: totalIncentive,
        total: basicSalary + totalIncentive,
      };
    });
  }, [teknisi, monthlyCompletedOrders]);

  // 3. Filtered list of expenses for the active month
  const monthlyExpensesList = useMemo(() => {
    return pengeluaran.filter((ex) => ex.tanggal.startsWith(selectedMonth));
  }, [pengeluaran, selectedMonth]);

  // 4. Operational Expenses & Revenue for selected month
  const financials = useMemo(() => {
    const totalGajiTeknisi = monthlySalaryRecap.reduce((sum, t) => sum + t.total, 0);
    const sparePartsProcurement = monthlyCompletedOrders.reduce((sum, o) => sum + getOrderPartsCost(o), 0);
    
    // Sum by category
    const transportBensin = monthlyExpensesList
      .filter((ex) => ex.kategori === "Transport & Bensin")
      .reduce((sum, ex) => sum + ex.jumlah, 0);
    const sewaRuko = monthlyExpensesList
      .filter((ex) => ex.kategori === "Sewa Kantor")
      .reduce((sum, ex) => sum + ex.jumlah, 0);
    const listrikInternet = monthlyExpensesList
      .filter((ex) => ex.kategori === "Listrik & Internet")
      .reduce((sum, ex) => sum + ex.jumlah, 0);
    const lainLain = monthlyExpensesList
      .filter((ex) => ex.kategori === "Lain-lain")
      .reduce((sum, ex) => sum + ex.jumlah, 0);

    const manualExpenses = monthlyExpensesList.reduce((sum, ex) => sum + ex.jumlah, 0);
    const totalExpenses = totalGajiTeknisi + sparePartsProcurement + manualExpenses;

    // Monthly Revenue
    const totalRevenue = monthlyCompletedOrders.reduce((sum, o) => sum + getOrderRevenue(o), 0);

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      gajiTeknisi: totalGajiTeknisi,
      sparePartsProcurement,
      transportBensin,
      sewaRuko,
      listrikInternet,
      lainLain,
    };
  }, [monthlyCompletedOrders, monthlySalaryRecap, monthlyExpensesList]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Keuangan & Insentif</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rekap pengeluaran operasional, pendapatan, dan perhitungan insentif harian teknisi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <Label className="text-xs text-muted-foreground mb-1">Pilih Bulan Rekap</Label>
            <Input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="w-44 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="size-24 text-success" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
              <ArrowUpRight className="size-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
              Bulan Ini
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Total Pendapatan</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{rupiah(financials.revenue)}</div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Dari {monthlyCompletedOrders.length} orderan selesai
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Receipt className="size-24 text-destructive" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center">
              <ArrowDownRight className="size-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">
              Bulan Ini
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Pengeluaran Operasional</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{rupiah(financials.expenses)}</div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Termasuk gaji pokok, insentif & pengeluaran mandiri
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="size-24 text-primary" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Coins className="size-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              Bersih
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Estimasi Laba Bersih</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{rupiah(financials.netProfit)}</div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Pendapatan dikurangi pengeluaran
          </p>
        </div>

        {/* Total Incentives */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Users className="size-24 text-warning-foreground" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-warning/15 text-warning-foreground flex items-center justify-center">
              <Activity className="size-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning-foreground font-semibold">
              Teknisi
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Total Insentif Teknisi</div>
          <div className="text-2xl font-bold mt-1 text-foreground">
            {rupiah(monthlySalaryRecap.reduce((a, b) => a + b.insentif, 0))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Berdasarkan pengerjaan selesai
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/80">
        <button
          onClick={() => setActiveTab("ringkasan")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-all cursor-pointer ${
            activeTab === "ringkasan"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Ringkasan & Kalkulator Insentif
        </button>
        <button
          onClick={() => setActiveTab("catatan")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-[2px] transition-all cursor-pointer ${
            activeTab === "catatan"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Catatan Pengeluaran Mandiri
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "ringkasan" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Daily Incentives Calculator */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border pb-4">
                <div>
                  <h3 className="text-lg font-bold">Kalkulator Insentif Harian</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Insentif harian otomatis berdasarkan tanggal selesai pengerjaan.
                  </p>
                </div>
                <div className="flex flex-col shrink-0">
                  <Label className="text-xs text-muted-foreground mb-1">Pilih Tanggal</Label>
                  <Input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="w-40 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                        <th className="pb-3">Nama Teknisi</th>
                        <th className="pb-3 text-center">Cuci (Rp 50k)</th>
                        <th className="pb-3 text-center">Perbaikan (Rp 100k)</th>
                        <th className="pb-3 text-right">Total Insentif</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {dailyIncentives.map((t) => (
                        <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                          <td className="py-3.5 font-medium">{t.nama}</td>
                          <td className="py-3.5 text-center font-medium text-primary">{t.cuci}</td>
                          <td className="py-3.5 text-center font-medium text-warning-foreground">{t.perbaikan}</td>
                          <td className="py-3.5 text-right font-bold text-success">{rupiah(t.total)}</td>
                        </tr>
                      ))}
                      {dailyIncentives.reduce((sum, t) => sum + t.total, 0) === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-xs text-muted-foreground border-none">
                            Tidak ada pengerjaan selesai pada tanggal ini
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {dailyOrders.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Detail Pengerjaan Hari Ini
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {dailyOrders.map((o) => {
                        const tek = teknisi.find((t) => t.id === o.teknisi_id);
                        const isWash = isCuci(o.keluhan);
                        return (
                          <div key={o.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-accent/40 border border-border/40">
                            <div>
                              <span className="font-semibold text-foreground">{o.nama_pelanggan}</span>
                              <p className="text-muted-foreground truncate max-w-xs sm:max-w-md mt-0.5">{o.keluhan}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isWash ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning-foreground"}`}>
                                {isWash ? "Cuci (+50k)" : "Perbaikan (+100k)"}
                              </span>
                              <p className="text-[10px] text-muted-foreground mt-1">Teknisi: {tek?.nama || "—"}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: monthly recap salary & operational breakdown */}
          <div className="lg:col-span-5 space-y-6">
            {/* Monthly Salary Recap */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="border-b border-border pb-3 mb-4">
                <h3 className="text-lg font-bold">Rekap Gaji Bulanan</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kalkulasi total gaji per teknisi untuk bulan {selectedMonth}.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                      <th className="pb-3">Teknisi</th>
                      <th className="pb-3 text-right">Gaji Pokok</th>
                      <th className="pb-3 text-right">Insentif</th>
                      <th className="pb-3 text-right">Total Gaji</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {monthlySalaryRecap.map((t) => (
                      <tr key={t.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 font-medium">{t.nama}</td>
                        <td className="py-3 text-right text-muted-foreground">{rupiah(t.pokok)}</td>
                        <td className="py-3 text-right text-primary font-medium">{rupiah(t.insentif)}</td>
                        <td className="py-3 text-right font-bold text-foreground">{rupiah(t.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Operational Expenses Summary Table */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="border-b border-border pb-3 mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">Pengeluaran Operasional</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Breakdown pengeluaran operasional perusahaan bulan {selectedMonth}.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("catatan")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white/[0.02] hover:bg-white/[0.06] text-xs font-semibold text-foreground transition-all cursor-pointer"
                >
                  <Plus className="size-3.5 text-muted-foreground" />
                  Tambah Catatan
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                      <th className="pb-3">Kategori Pengeluaran</th>
                      <th className="pb-3 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    <tr>
                      <td className="py-2.5 font-medium text-foreground">Total Gaji Teknisi (Pokok + Insentif)</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">{rupiah(financials.gajiTeknisi)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-foreground">Pembelian / Restock Spare Part</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">{rupiah(financials.sparePartsProcurement)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-foreground">Transportasi & Bensin Teknisi</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">{rupiah(financials.transportBensin)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-foreground">Sewa Kantor / Ruko</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">{rupiah(financials.sewaRuko)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-foreground">Listrik, Air, & Internet</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">{rupiah(financials.listrikInternet)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-medium text-foreground">Pengeluaran Lain-lain</td>
                      <td className="py-2.5 text-right font-semibold text-foreground">{rupiah(financials.lainLain)}</td>
                    </tr>
                    <tr className="border-t border-border pt-2 font-bold text-sm bg-accent/20">
                      <td className="py-3 px-2 rounded-l-lg text-foreground">Total Pengeluaran</td>
                      <td className="py-3 px-2 text-right rounded-r-lg text-destructive">{rupiah(financials.expenses)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Tab Catatan Pengeluaran */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Tambah Pengeluaran */}
          <div className="lg:col-span-4">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold mb-1">Tambah Pengeluaran</h3>
              <p className="text-xs text-muted-foreground mb-5">
                Catat pengeluaran operasional baru secara manual ke sistem.
              </p>

              <form onSubmit={handleAddEx} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kategori Pengeluaran</Label>
                  <select
                    value={formEx.kategori}
                    onChange={(e) => setFormEx((prev) => ({ ...prev, kategori: e.target.value }))}
                    className="bg-white/[0.04] border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full cursor-pointer"
                  >
                    <option value="Transport & Bensin" className="bg-[#14141b] text-foreground">Transport & Bensin</option>
                    <option value="Sewa Kantor" className="bg-[#14141b] text-foreground">Sewa Kantor</option>
                    <option value="Listrik & Internet" className="bg-[#14141b] text-foreground">Listrik, Air & Internet</option>
                    <option value="Lain-lain" className="bg-[#14141b] text-foreground">Lain-lain (ATK, Konsumsi, dll)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Jumlah Pengeluaran (Rp)</Label>
                  <Input
                    type="number"
                    value={formEx.jumlah}
                    onChange={(e) => setFormEx((prev) => ({ ...prev, jumlah: e.target.value }))}
                    placeholder="Contoh: 150000"
                    className="bg-white/[0.04] border-border text-foreground text-sm py-2 px-3.5"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Tanggal Transaksi</Label>
                  <Input
                    type="date"
                    value={formEx.tanggal}
                    onChange={(e) => setFormEx((prev) => ({ ...prev, tanggal: e.target.value }))}
                    className="bg-white/[0.04] border-border text-foreground text-sm py-2 px-3.5"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Keterangan / Deskripsi</Label>
                  <Input
                    type="text"
                    value={formEx.keterangan}
                    onChange={(e) => setFormEx((prev) => ({ ...prev, keterangan: e.target.value }))}
                    placeholder="Contoh: Beli Pertalite Teknisi Joko"
                    className="bg-white/[0.04] border-border text-foreground text-sm py-2 px-3.5"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer text-sm"
                >
                  <Plus className="size-4" />
                  Simpan Pengeluaran
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Daftar Pengeluaran Table */}
          <div className="lg:col-span-8">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold">Catatan Pengeluaran Bulan {selectedMonth}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Daftar lengkap pengeluaran operasional mandiri di luar gaji teknisi dan sparepart.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent/40 border border-border/60">
                  Total: {rupiah(monthlyExpensesList.reduce((sum, ex) => sum + ex.jumlah, 0))}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                      <th className="pb-3">Tanggal</th>
                      <th className="pb-3">Kategori</th>
                      <th className="pb-3">Keterangan</th>
                      <th className="pb-3 text-right">Jumlah</th>
                      <th className="pb-3 text-center w-12">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {monthlyExpensesList.map((ex) => (
                      <tr key={ex.id} className="hover:bg-accent/20 transition-colors">
                        <td className="py-3 text-muted-foreground font-medium">{ex.tanggal}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            ex.kategori === "Transport & Bensin" 
                              ? "bg-amber-500/10 text-amber-500" 
                              : ex.kategori === "Sewa Kantor"
                              ? "bg-purple-500/10 text-purple-500"
                              : ex.kategori === "Listrik & Internet"
                              ? "bg-cyan-500/10 text-cyan-500"
                              : "bg-gray-500/10 text-gray-500"
                          }`}>
                            {ex.kategori}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-foreground">{ex.keterangan}</td>
                        <td className="py-3 text-right font-bold text-foreground">{rupiah(ex.jumlah)}</td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => handleDeleteEx(ex.id)}
                            className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {monthlyExpensesList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground border-none">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Info className="size-6 text-muted-foreground/60" />
                            <span>Belum ada catatan pengeluaran mandiri pada bulan ini.</span>
                            <span className="text-[10px] text-muted-foreground/40">Gunakan form di sebelah kiri untuk menambah pengeluaran operasional.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
