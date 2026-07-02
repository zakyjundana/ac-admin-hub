import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Package, AlertTriangle, Minus, Trash2, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { useStore, store } from "@/lib/dataStore";
import { KATEGORI_SPAREPART, type SparePart } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/stok")({
  head: () => {
    const title = "Manajemen Stok — CoolService";
    const description = "Pantau stok spare part AC, kategori, harga jual, dan peringatan otomatis saat persediaan mulai menipis.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "https://coolboard.lovable.app/stok" },
      ],
      links: [{ rel: "canonical", href: "https://coolboard.lovable.app/stok" }],
    };
  },
  component: StokPage,
});

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

type FormState = Omit<SparePart, "id">;
const emptyForm: FormState = {
  nama: "", kategori: KATEGORI_SPAREPART[0], satuan: "pcs",
  stok: 0, stok_minimum: 5, harga: 0,
};

function StokPage() {
  const sparepart = useStore((s) => s.sparepart);
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = useMemo(
    () =>
      sparepart
        .filter((s) => kategori === "all" || s.kategori === kategori)
        .filter((s) => !q || s.nama.toLowerCase().includes(q.toLowerCase())),
    [sparepart, q, kategori],
  );

  const stats = useMemo(() => {
    const low = sparepart.filter((s) => s.stok <= s.stok_minimum && s.stok > 0).length;
    const habis = sparepart.filter((s) => s.stok === 0).length;
    const totalNilai = sparepart.reduce((a, s) => a + s.stok * s.harga, 0);
    return { total: sparepart.length, low, habis, totalNilai };
  }, [sparepart]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: SparePart) => {
    setEditing(s);
    setForm({ nama: s.nama, kategori: s.kategori, satuan: s.satuan, stok: s.stok, stok_minimum: s.stok_minimum, harga: s.harga });
    setOpen(true);
  };
  const submit = () => {
    if (!form.nama.trim()) { toast.error("Nama wajib diisi"); return; }
    if (editing) {
      store.updateSparePart(editing.id, form);
      toast.success("Spare part diperbarui");
    } else {
      store.addSparePart(form);
      toast.success("Spare part ditambahkan");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toaster richColors position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Manajemen Stok</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola persediaan spare part service AC.</p>
        </div>
        <Button onClick={openNew} size="lg" className="shadow-lg shadow-primary/20">
          <Plus className="size-4" /> Tambah Spare Part
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Package} label="Total Item" value={stats.total.toString()} tint="primary" />
        <Stat icon={AlertTriangle} label="Stok Menipis" value={stats.low.toString()} tint="warning" />
        <Stat icon={AlertTriangle} label="Habis" value={stats.habis.toString()} tint="destructive" />
        <Stat icon={Package} label="Total Nilai" value={rupiah(stats.totalNilai)} tint="success" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari spare part..." className="pl-9" />
        </div>
        <Select value={kategori} onValueChange={setKategori}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {KATEGORI_SPAREPART.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const habis = s.stok === 0;
          const low = !habis && s.stok <= s.stok_minimum;
          return (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{s.nama}</h3>
                    {habis && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-bold">HABIS</span>}
                    {low && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/20 text-warning-foreground font-bold">MENIPIS</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.kategori} • {rupiah(s.harga)} / {s.satuan}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(s)}>
                    <Edit3 className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => { store.deleteSparePart(s.id); toast.success("Dihapus"); }}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-border">
                <div>
                  <div className={cn("text-2xl font-bold", habis ? "text-destructive" : low ? "text-warning-foreground" : "text-primary")}>
                    {s.stok}
                  </div>
                  <div className="text-[11px] text-muted-foreground">min {s.stok_minimum} {s.satuan}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="size-8" onClick={() => store.adjustStok(s.id, -1)}>
                    <Minus className="size-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="size-8" onClick={() => store.adjustStok(s.id, +1)}>
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
            Tidak ada spare part yang cocok
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Spare Part" : "Tambah Spare Part"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Nama</Label>
              <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KATEGORI_SPAREPART.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Satuan</Label>
              <Input value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Stok</Label>
              <Input type="number" min={0} value={form.stok} onChange={(e) => setForm({ ...form, stok: +e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Stok Minimum</Label>
              <Input type="number" min={0} value={form.stok_minimum} onChange={(e) => setForm({ ...form, stok_minimum: +e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Harga (Rp)</Label>
              <Input type="number" min={0} value={form.harga} onChange={(e) => setForm({ ...form, harga: +e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={submit}>{editing ? "Simpan" : "Tambah"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string;
  tint: "primary" | "warning" | "destructive" | "success";
}) {
  const tintClass = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/15 text-success",
  }[tint];
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`size-10 rounded-xl flex items-center justify-center ${tintClass}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-bold leading-tight truncate">{value}</div>
        </div>
      </div>
    </div>
  );
}
