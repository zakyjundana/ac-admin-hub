import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Phone, MapPin, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { useStore, store } from "@/lib/dataStore";
import { WILAYAH_LIST } from "@/lib/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/teknisi")({
  head: () => {
    const title = "Manajemen Teknisi — CoolService";
    const description = "Kelola data teknisi service AC, kontak, dan wilayah kerja untuk pembagian tugas harian yang lebih rapi.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: "https://coolboard.lovable.app/teknisi" },
      ],
      links: [{ rel: "canonical", href: "https://coolboard.lovable.app/teknisi" }],
    };
  },
  component: TeknisiPage,
});

function TeknisiPage() {
  const teknisi = useStore((s) => s.teknisi);
  const orderan = useStore((s) => s.orderan);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nama: "", no_hp: "", wilayah: WILAYAH_LIST[0] });

  const submit = () => {
    if (!form.nama || !form.no_hp) {
      toast.error("Nama dan No HP wajib diisi");
      return;
    }
    store.addTeknisi(form);
    setForm({ nama: "", no_hp: "", wilayah: WILAYAH_LIST[0] });
    setOpen(false);
    toast.success("Teknisi ditambahkan");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Toaster richColors position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Daftar Teknisi</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola data teknisi dan wilayah kerja.</p>
        </div>
        <Button onClick={() => setOpen(true)} size="lg" className="shadow-lg shadow-primary/20">
          <Plus className="size-4" /> Tambah Teknisi
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teknisi.map((t) => {
          const aktif = orderan.filter((o) => o.teknisi_id === t.id && o.status !== "Selesai").length;
          const total = orderan.filter((o) => o.teknisi_id === t.id).length;
          return (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center text-primary-foreground shrink-0">
                  <User className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{t.nama}</h3>
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5"><MapPin className="size-3" />{t.wilayah}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    store.deleteTeknisi(t.id);
                    toast.success("Teknisi dihapus");
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <Phone className="size-3.5" />{t.no_hp}
                </div>
                <div className="flex gap-4 text-xs">
                  <div><span className="font-bold text-primary">{aktif}</span> <span className="text-muted-foreground">aktif</span></div>
                  <div><span className="font-bold">{total}</span> <span className="text-muted-foreground">total order</span></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Teknisi Baru</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>No. HP</Label>
              <Input value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} placeholder="08xxx" />
            </div>
            <div className="space-y-1.5">
              <Label>Wilayah</Label>
              <Select value={form.wilayah} onValueChange={(v) => setForm({ ...form, wilayah: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WILAYAH_LIST.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={submit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
