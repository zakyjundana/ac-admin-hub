import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Plus, Filter, CalendarDays, Users, ClipboardList, CheckCircle2, Share2, Copy, Send } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";
import { OrderanDialog } from "@/components/OrderanDialog";
import { OrderanTable } from "@/components/OrderanTable";
import { useStore } from "@/lib/dataStore";
import { WILAYAH_LIST, type Orderan } from "@/lib/mockData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";


export const Route = createFileRoute("/_app/jadwal")({
  head: () => {
    const title = "Manajemen Jadwal — CoolService";
    const description = "Kalender interaktif untuk atur jadwal servis AC harian & bulanan serta assign teknisi berdasarkan wilayah kerja.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "https://coolboard.lovable.app/jadwal" },
      ],
      links: [{ rel: "canonical", href: "https://coolboard.lovable.app/jadwal" }],
    };
  },
  component: JadwalPage,
});

function JadwalPage() {
  const orderan = useStore((s) => s.orderan);
  const teknisi = useStore((s) => s.teknisi);
  const { user } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Orderan | null>(null);
  const [filterWilayah, setFilterWilayah] = useState<string>("all");
  const [bookingUrl, setBookingUrl] = useState("https://coolboard.lovable.app/book?shop=demo-user-id");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBookingUrl(`${window.location.origin}/book?shop=${user?.id || "demo-user-id"}`);
    }
  }, [user]);

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
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowShare(true)} variant="outline" className="shadow-sm border-primary/20 text-primary hover:bg-primary/5 h-10 px-4 rounded-xl flex items-center gap-2">
            <Share2 className="size-4" /> Bagikan Link Booking
          </Button>
          <Button onClick={openNew} size="lg" className="shadow-lg shadow-primary/20">
            <Plus className="size-4" /> Orderan Baru
          </Button>
        </div>
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
              showKirimJadwal={true}
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

      {/* Dialog Share Booking Link */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-md bg-[#0f0f15] border border-white/5 text-white shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              Bagikan Tautan Booking Mandiri
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-400">
              Klien Anda dapat memilih tanggal & waktu servis AC secara langsung melalui tautan kalender berikut.
            </p>
            
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
              <span className="text-xs text-primary truncate select-all">
                {bookingUrl}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-gray-400 hover:text-white shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(bookingUrl);
                  toast.success("Link berhasil disalin!");
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full sm:flex-1 text-xs border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white"
              onClick={() => setShowShare(false)}
            >
              Tutup
            </Button>
            <Button
              size="sm"
              className="w-full sm:flex-1 text-xs flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white font-bold"
              onClick={() => {
                const pesan = `Halo! Sekarang Anda bisa melakukan booking jadwal servis/cuci AC Anda secara langsung dan memilih tanggal kosong melalui kalender online kami di sini:\n\n${bookingUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, "_blank");
                setShowShare(false);
              }}
            >
              <Send className="size-3.5" /> Kirim via WA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
