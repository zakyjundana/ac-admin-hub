import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Plus, Filter, CalendarDays, Users, ClipboardList, CheckCircle2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { OrderanDialog } from "@/components/OrderanDialog";
import { OrderanTable } from "@/components/OrderanTable";
import { useStore } from "@/lib/dataStore";
import { WILAYAH_LIST, type Orderan } from "@/lib/mockData";

export const Route = createFileRoute("/_app/jadwal")({
  head: () => ({ meta: [{ title: "Manajemen Jadwal — CoolService" }] }),
  component: JadwalPage,
});

function JadwalPage() {
  const orderan = useStore((s) => s.orderan);
  const teknisi = useStore((s) => s.teknisi);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Orderan | null>(null);
  const [filterWilayah, setFilterWilayah] = useState<string>("all");

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const todayOrders = useMemo(
    () =>
      orderan
        .filter((o) => o.tanggal === selectedKey)
        .filter((o) => filterWilayah === "all" || o.wilayah === filterWilayah)
        .sort((a, b) => a.jam.localeCompare(b.jam)),
    [orderan, selectedKey, filterWilayah],
  );

  const stats = useMemo(() => {
    const todays = orderan.filter((o) => o.tanggal === selectedKey);
    return {
      total: todays.length,
      belum: todays.filter((o) => o.status === "Belum Selesai").length,
      proses: todays.filter((o) => o.status === "Dalam Pengerjaan").length,
      selesai: todays.filter((o) => o.status === "Selesai").length,
    };
  }, [orderan, selectedKey]);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (o: Orderan) => { setEditing(o); setOpen(true); };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toaster richColors position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Manajemen Jadwal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atur jadwal teknisi dan pantau orderan service AC harian.
          </p>
        </div>
        <Button onClick={openNew} size="lg" className="shadow-lg shadow-primary/20">
          <Plus className="size-4" /> Orderan Baru
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CalendarDays} label="Total Hari Ini" value={stats.total} tint="primary" />
        <StatCard icon={ClipboardList} label="Belum Selesai" value={stats.belum} tint="warning" />
        <StatCard icon={Users} label="Dalam Pengerjaan" value={stats.proses} tint="primary" />
        <StatCard icon={CheckCircle2} label="Selesai" value={stats.selesai} tint="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ScheduleCalendar
            orderan={orderan}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold capitalize">
                  {format(selectedDate, "EEEE, d MMM yyyy", { locale: localeId })}
                </h3>
                <p className="text-xs text-muted-foreground">{todayOrders.length} orderan</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={filterWilayah} onValueChange={setFilterWilayah}>
                  <SelectTrigger className="h-9 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Wilayah</SelectItem>
                    {WILAYAH_LIST.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <OrderanTable
              orderan={todayOrders}
              teknisi={teknisi}
              onEdit={openEdit}
              emptyText="Belum ada orderan untuk tanggal ini"
            />
          </div>
        </div>
      </div>

      <OrderanDialog
        open={open}
        onOpenChange={setOpen}
        defaultDate={selectedKey}
        editing={editing}
        teknisi={teknisi}
      />
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: number;
  tint: "primary" | "warning" | "success";
}) {
  const tintClass = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success",
  }[tint];
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-xl flex items-center justify-center ${tintClass}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold leading-tight">{value}</div>
        </div>
      </div>
    </div>
  );
}
