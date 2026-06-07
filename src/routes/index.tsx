import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { 
  TrendingUp, 
  Coins, 
  Users, 
  ClipboardList, 
  Star, 
  AlertTriangle,
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet,
  Activity,
  PackageCheck
} from "lucide-react";
import { useStore } from "@/lib/dataStore";
import { type Orderan, type SparePart, dataKeuanganHistoris } from "@/lib/mockData";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard Analitik — CoolService" }] }),
  component: DashboardPage,
});

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const orderan = useStore((s) => s.orderan);
  const teknisi = useStore((s) => s.teknisi);
  const sparepart = useStore((s) => s.sparepart);
  const feedback = useStore((s) => s.feedback);

  // Helper classification & calculations (Consistent with Keuangan page)
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

  // June 2026 live calculations
  const juneCompletedOrders = useMemo(() => {
    return orderan.filter((o) => o.status === "Selesai" && o.tanggal.startsWith("2026-06"));
  }, [orderan]);

  const financialsJune = useMemo(() => {
    const basicSalary = 3500000;
    const totalGajiTeknisi = teknisi.map((t) => {
      const orders = juneCompletedOrders.filter((o) => o.teknisi_id === t.id);
      const totalIncentive = orders.reduce((sum, o) => sum + getIncentive(o.keluhan), 0);
      return basicSalary + totalIncentive;
    }).reduce((sum, sal) => sum + sal, 0);

    const sparePartsProcurement = juneCompletedOrders.reduce((sum, o) => sum + getOrderPartsCost(o), 0);
    
    const transportBensin = 1500000;
    const sewaRuko = 4000000;
    const listrikInternet = 850000;
    const totalExpenses = totalGajiTeknisi + sparePartsProcurement + transportBensin + sewaRuko + listrikInternet;

    const totalRevenue = juneCompletedOrders.reduce((sum, o) => sum + getOrderRevenue(o), 0);

    return {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }, [juneCompletedOrders, teknisi, sparepart]);

  // Combine historical data with June 2026 live calculations
  const chartData = useMemo(() => {
    const historical = dataKeuanganHistoris.map((h) => ({
      name: h.bulan,
      Pemasukan: h.pemasukan,
      Pengeluaran: h.pengeluaran,
      "Keuntungan Bersih": h.keuntungan,
    }));

    return [
      ...historical,
      {
        name: "Jun",
        Pemasukan: financialsJune.revenue,
        Pengeluaran: financialsJune.expenses,
        "Keuntungan Bersih": financialsJune.netProfit,
      }
    ];
  }, [financialsJune]);

  // General KPIs
  const avgRating = useMemo(() => {
    if (feedback.length === 0) return 0;
    const sum = feedback.reduce((acc, f) => acc + f.rating, 0);
    return Math.round((sum / feedback.length) * 10) / 10;
  }, [feedback]);

  const activeOrdersCount = useMemo(() => {
    return orderan.filter((o) => o.status !== "Selesai").length;
  }, [orderan]);

  const lowStockParts = useMemo(() => {
    return sparepart.filter((sp) => sp.stok <= sp.stok_minimum);
  }, [sparepart]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Dashboard Analitik</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau kesehatan keuangan, kepuasan pelanggan, dan performa bisnis CoolService Anda secara real-time.
        </p>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
              <ArrowUpRight className="size-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
              Pemasukan
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Pemasukan Bulan Ini</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{rupiah(financialsJune.revenue)}</div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Dari {juneCompletedOrders.length} orderan selesai di Juni
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center">
              <ArrowDownRight className="size-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-semibold">
              Pengeluaran
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Pengeluaran Bulan Ini</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{rupiah(financialsJune.expenses)}</div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Gaji teknisi + operasional ruko
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Coins className="size-5" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold font-medium">
              Profit
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Laba Bersih Bulan Ini</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{rupiah(financialsJune.netProfit)}</div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Pemasukan dikurangi pengeluaran
          </p>
        </div>

        {/* Avg Rating & Satisfaction */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="size-10 rounded-xl bg-warning/15 text-warning-foreground flex items-center justify-center">
              <Star className="size-5 fill-warning-foreground" />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning-foreground font-semibold">
              Kepuasan
            </span>
          </div>
          <div className="text-xs text-muted-foreground">Rata-rata Rating Kepuasan</div>
          <div className="text-2xl font-bold mt-1 text-foreground">{avgRating} / 5.0</div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Berdasarkan {feedback.length} ulasan pelanggan
          </p>
        </div>
      </div>

      {/* Main Charts & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial Trends Chart */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-lg font-bold">Tren Kesehatan Keuangan Bulanan</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Perbandingan bulanan antara pemasukan, pengeluaran, dan laba bersih.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-accent/40 border border-border/50 rounded-lg p-1 text-[11px] text-muted-foreground">
              <span className="px-2 py-1 bg-background rounded-md text-foreground shadow-sm font-medium">
                6 Bulan Terakhir
              </span>
            </div>
          </div>

          <div className="w-full h-80 flex items-center justify-center">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorKeuntungan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                  <XAxis dataKey="name" className="text-[10px] fill-muted-foreground" />
                  <YAxis 
                    className="text-[10px] fill-muted-foreground"
                    tickFormatter={(val) => `Rp ${val / 1000000}M`}
                  />
                  <Tooltip
                    formatter={(value: number) => [rupiah(value), ""]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "12px",
                      fontSize: "12px"
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "15px" }} />
                  <Area 
                    type="monotone" 
                    dataKey="Pemasukan" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorPemasukan)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Pengeluaran" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorPengeluaran)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Keuntungan Bersih" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorKeuntungan)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-accent/20 animate-pulse rounded-xl" />
            )}
          </div>
        </div>

        {/* Right Sidebar: Active Tasks and Inventory Alerts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Orders Summary */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <ClipboardList className="size-4 text-primary" />
              Status Operasional
            </h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-accent/40 border border-border/40 rounded-xl p-3.5">
                <span className="text-xs text-muted-foreground">Orderan Aktif</span>
                <div className="text-2xl font-bold mt-1 text-primary">{activeOrdersCount}</div>
              </div>
              <div className="bg-accent/40 border border-border/40 rounded-xl p-3.5">
                <span className="text-xs text-muted-foreground">Orderan Selesai</span>
                <div className="text-2xl font-bold mt-1 text-success">{juneCompletedOrders.length}</div>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
              Total teknisi yang aktif bertugas: <span className="font-semibold text-foreground">{teknisi.length} orang</span>.
            </div>
          </div>

          {/* Inventory Alert Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-warning-foreground">
              <AlertTriangle className="size-4 text-warning" />
              Peringatan Stok Spare Part
            </h3>
            
            {lowStockParts.length > 0 ? (
              <div className="space-y-3">
                {lowStockParts.slice(0, 4).map((sp) => (
                  <div key={sp.id} className="flex items-center justify-between text-xs border-b border-border/40 pb-2 last:border-none last:pb-0">
                    <div>
                      <span className="font-medium text-foreground">{sp.nama}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Kategori: {sp.kategori}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-destructive">{sp.stok} {sp.satuan}</span>
                      <p className="text-[9px] text-muted-foreground mt-0.5">Min: {sp.stok_minimum}</p>
                    </div>
                  </div>
                ))}
                {lowStockParts.length > 4 && (
                  <p className="text-[11px] text-muted-foreground text-center pt-2">
                    + {lowStockParts.length - 4} barang kritis lainnya.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground flex flex-col items-center gap-2">
                <PackageCheck className="size-8 text-success/60" />
                Semua stok spare part aman (di atas batas minimum).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
