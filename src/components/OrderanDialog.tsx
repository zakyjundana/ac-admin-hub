import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WILAYAH_LIST, STATUS_LIST, type Orderan, type Teknisi } from "@/lib/mockData";
import { store } from "@/lib/dataStore";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate?: string;
  editing?: Orderan | null;
  teknisi: Teknisi[];
}

type FormState = Omit<Orderan, "id">;
const empty = (date: string): FormState => ({
  nama_pelanggan: "",
  no_wa: "",
  alamat: "",
  wilayah: WILAYAH_LIST[0],
  keluhan: "",
  status: "Belum Selesai",
  teknisi_id: null,
  tanggal: date,
  jam: "09:00",
});

export function OrderanDialog({ open, onOpenChange, defaultDate, editing, teknisi }: Props) {
  const [form, setForm] = useState<FormState>(() => empty(defaultDate || new Date().toISOString().slice(0, 10)));

  useEffect(() => {
    if (open) {
      setForm(editing ? { ...editing } : empty(defaultDate || new Date().toISOString().slice(0, 10)));
    }
  }, [open, editing, defaultDate]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.nama_pelanggan || !form.no_wa || !form.alamat) {
      toast.error("Lengkapi data pelanggan terlebih dahulu");
      return;
    }
    if (editing) {
      store.updateOrderan(editing.id, form);
      toast.success("Orderan berhasil diperbarui");
    } else {
      store.addOrderan(form);
      toast.success("Orderan baru ditambahkan");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Orderan" : "Tambah Orderan Baru"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-1.5">
            <Label>Nama Pelanggan</Label>
            <Input value={form.nama_pelanggan} onChange={(e) => set("nama_pelanggan", e.target.value)} placeholder="Bapak / Ibu ..." />
          </div>
          <div className="space-y-1.5">
            <Label>No. WhatsApp</Label>
            <Input value={form.no_wa} onChange={(e) => set("no_wa", e.target.value)} placeholder="08xxx" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Alamat</Label>
            <Textarea value={form.alamat} onChange={(e) => set("alamat", e.target.value)} placeholder="Alamat lengkap" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Wilayah</Label>
            <Select value={form.wilayah} onValueChange={(v) => set("wilayah", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WILAYAH_LIST.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Teknisi</Label>
            <Select
              value={form.teknisi_id ?? "none"}
              onValueChange={(v) => set("teknisi_id", v === "none" ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Pilih teknisi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Belum ditugaskan</SelectItem>
                {teknisi.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nama} — {t.wilayah}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tanggal</Label>
            <Input type="date" value={form.tanggal} onChange={(e) => set("tanggal", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Jam</Label>
            <Input type="time" value={form.jam} onChange={(e) => set("jam", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as Orderan["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Keluhan</Label>
            <Textarea value={form.keluhan} onChange={(e) => set("keluhan", e.target.value)} placeholder="Deskripsi keluhan / servis yang diminta" rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={submit}>{editing ? "Simpan Perubahan" : "Tambah Orderan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
