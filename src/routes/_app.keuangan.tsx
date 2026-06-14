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
  Settings
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { useStore } from "@/lib/dataStore";
import { type Orderan, type SparePart } from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
  const demoMode = useStore((s) => s.demoMode);

  // States
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-06"); // Format YYYY-MM

  // States for manual operational expenses input
  const [opExpenses, setOpExpenses] = useState<{
    transportBensin: number;
    sewaRuko: number;
    listrikInternet: number;
  }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("coolservice_op_expenses");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return {
      transportBensin: 0,
      sewaRuko: 0,
      listrikInternet: 0,
    };
  });

  const [isEditingExpenses, setIsEditingExpenses] = useState(false);
  const [tempExpenses, setTempExpenses] = useState(opExpenses);

  const handleSaveExpenses = () => {
    setOpExpenses(tempExpenses);
    if (typeof window !== "undefined") {
      localStorage.setItem("coolservice_op_expenses", JSON.stringify(tempExpenses));
    }
    setIsEditingExpenses(false);
    toast.success("Pengeluaran operasional berhasil diperbarui");
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

  // 3. Operational Expenses & Revenue for selected month
  const financials = useMemo(() => {
    const totalGajiTeknisi = monthlySalaryRecap.reduce((sum, t) => sum + t.total, 0);
    const sparePartsProcurement = monthlyCompletedOrders.reduce((sum, o) => sum + getOrderPartsCost(o), 0);
    
    // Constant operational expenses or loaded values
    const transportBensin = demoMode ? 1500000 : opExpenses.transportBensin;
    const sewaRuko = demoMode ? 4000000 : opExpenses.sewaRuko;
    const listrikInternet = demoMode ? 850000 : opExpenses.listrikInternet;
    const totalExpenses = totalGajiTeknisi + sparePartsProcurement + transportBensin + sewaRuko + listrikInternet;

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
    };
  }, [monthlyCompletedOrders, monthlySalaryRecap, demoMode, opExpenses]);

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
            Termasuk gaji pokok & insentif
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

          {/* Operational Expenses Table */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="border-b border-border pb-3 mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Pengeluaran Operasional</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Breakdown pengeluaran operasional perusahaan bulan {selectedMonth}.
                </p>
              </div>
              {!demoMode && (
                <Dialog open={isEditingExpenses} onOpenChange={setIsEditingExpenses}>
                  <DialogTrigger asChild>
                    <button 
                      onClick={() => setTempExpenses(opExpenses)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white/[0.02] hover:bg-white/[0.06] text-xs font-semibold text-foreground transition-all cursor-pointer"
                    >
                      <Settings className="size-3.5 text-muted-foreground" />
                      Edit Pengeluaran
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-[#0f0f15] border border-white/5 text-white shadow-2xl rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold text-white">Edit Pengeluaran Operasional</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-400">Transportasi & Bensin Teknisi (Rp)</Label>
                        <Input 
                          type="number"
                          value={tempExpenses.transportBensin}
                          onChange={(e) => setTempExpenses(prev => ({ ...prev, transportBensin: Number(e.target.value) }))}
                          className="bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-400">Sewa Kantor / Ruko (Rp)</Label>
                        <Input 
                          type="number"
                          value={tempExpenses.sewaRuko}
                          onChange={(e) => setTempExpenses(prev => ({ ...prev, sewaRuko: Number(e.target.value) }))}
                          className="bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-400">Listrik, Air, & Internet (Rp)</Label>
                        <Input 
                          type="number"
                          value={tempExpenses.listrikInternet}
                          onChange={(e) => setTempExpenses(prev => ({ ...prev, listrikInternet: Number(e.target.value) }))}
                          className="bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingExpenses(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm text-gray-400 transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={handleSaveExpenses}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                      >
                        Simpan
                      </button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
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
    </div>
  );
}
