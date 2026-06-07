import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { OrderanDialog } from "@/components/OrderanDialog";
import { OrderanTable } from "@/components/OrderanTable";
import { useStore } from "@/lib/dataStore";
import { WILAYAH_LIST, STATUS_LIST, type Orderan } from "@/lib/mockData";

export const Route = createFileRoute("/_app/orderan")({
  head: () => ({ meta: [{ title: "Orderan — CoolService" }] }),
  component: OrderanPage,
});

function OrderanPage() {
  const orderan = useStore((s) => s.orderan);
  const teknisi = useStore((s) => s.teknisi);
  const [q, setQ] = useState("");
  const [wilayah, setWilayah] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Orderan | null>(null);

  const filtered = useMemo(() => {
    return orderan
      .filter((o) => wilayah === "all" || o.wilayah === wilayah)
      .filter((o) => status === "all" || o.status === status)
      .filter((o) => {
        if (!q) return true;
        const s = q.toLowerCase();
        return (
          o.nama_pelanggan.toLowerCase().includes(s) ||
          o.alamat.toLowerCase().includes(s) ||
          o.no_wa.includes(s) ||
          o.keluhan.toLowerCase().includes(s)
        );
      })
      .sort((a, b) => (b.tanggal + b.jam).localeCompare(a.tanggal + a.jam));
  }, [orderan, q, wilayah, status]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toaster richColors position="top-right" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Semua Orderan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar lengkap orderan service AC dari pelanggan.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} size="lg" className="shadow-lg shadow-primary/20">
          <Plus className="size-4" /> Orderan Baru
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, alamat, no WA..." className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={wilayah} onValueChange={setWilayah}>
            <SelectTrigger className="w-40"><Filter className="size-3.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Wilayah</SelectItem>
              {WILAYAH_LIST.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <OrderanTable
        orderan={filtered}
        teknisi={teknisi}
        onEdit={(o) => { setEditing(o); setOpen(true); }}
        showKirimInvoice={true}
      />

      <OrderanDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        teknisi={teknisi}
      />
    </div>
  );
}
