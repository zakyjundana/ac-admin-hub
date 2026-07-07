import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WILAYAH_LIST, STATUS_LIST, type Orderan, type Teknisi } from "@/lib/mockData";
import { store, useStore } from "@/lib/dataStore";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  createCalendarEvent,
  updateCalendarEvent,
} from "@/lib/api/google-calendar.functions";

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
  spare_parts: [],
  email_pelanggan: "",
});

/**
 * Bangun ISO datetime lokal dari tanggal + jam (untuk Google Calendar).
 * Format tanpa timezone offset — kita kirim `timeZone: 'Asia/Jakarta'` terpisah.
 */
function toLocalISO(tanggal: string, jam: string) {
  return `${tanggal}T${jam}:00`;
}
function addHoursLocal(tanggal: string, jam: string, hours: number) {
  const d = new Date(`${tanggal}T${jam}:00`);
  d.setHours(d.getHours() + hours);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":00"
  );
}

export function OrderanDialog({ open, onOpenChange, defaultDate, editing, teknisi }: Props) {
  const [form, setForm] = useState<FormState>(() => empty(defaultDate || new Date().toISOString().slice(0, 10)));
  const [syncing, setSyncing] = useState(false);
  const spareparts = useStore((s) => s.sparepart);
  const createEventFn = useServerFn(createCalendarEvent);
  const updateEventFn = useServerFn(updateCalendarEvent);

  useEffect(() => {
    if (open) {
      setForm(editing ? { ...editing } : empty(defaultDate || new Date().toISOString().slice(0, 10)));
    }
  }, [open, editing, defaultDate]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const selectedSparePartId = form.spare_parts?.[0]?.sparepart_id ?? "none";
  const selectedQty = form.spare_parts?.[0]?.qty ?? 1;

  const syncToGoogleCalendar = async (orderan: FormState & { id?: string }) => {
    const teknisiObj = teknisi.find((t) => t.id === orderan.teknisi_id);
    const attendees = [orderan.email_pelanggan, teknisiObj?.email].filter(
      (e): e is string => !!e && /.+@.+\..+/.test(e),
    );
    const title = `Servis AC — ${orderan.nama_pelanggan}`;
    const description = [
      `Pelanggan: ${orderan.nama_pelanggan}`,
      `WA: ${orderan.no_wa}`,
      teknisiObj ? `Teknisi: ${teknisiObj.nama} (${teknisiObj.no_hp})` : null,
      `Keluhan: ${orderan.keluhan}`,
      `Status: ${orderan.status}`,
    ]
      .filter(Boolean)
      .join("\n");
    const location = `${orderan.alamat}, ${orderan.wilayah}`;
    const startISO = toLocalISO(orderan.tanggal, orderan.jam);
    const endISO = addHoursLocal(orderan.tanggal, orderan.jam, 1);

    try {
      if (editing?.google_event_id) {
        const res = await updateEventFn({
          data: {
            google_event_id: editing.google_event_id,
            title,
            description,
            location,
            startISO,
            endISO,
            attendeeEmails: attendees,
          },
        });
        if (!res.ok) {
          if (res.error === "not_connected") return { skipped: true };
          throw new Error(res.error);
        }
        return { ok: true };
      } else {
        const res = await createEventFn({
          data: {
            title,
            description,
            location,
            startISO,
            endISO,
            attendeeEmails: attendees,
          },
        });
        if (!res.ok) {
          if (res.error === "not_connected") return { skipped: true };
          throw new Error(res.error);
        }
        return { ok: true, google_event_id: res.google_event_id };
      }
    } catch (err) {
      throw err;
    }
  };

  const submit = async () => {
    if (!form.nama_pelanggan || !form.no_wa || !form.alamat) {
      toast.error("Lengkapi data pelanggan terlebih dahulu");
      return;
    }

    setSyncing(true);
    try {
      // 1. Simpan ke store lokal / Supabase (sesuai flow existing).
      if (editing) {
        await store.updateOrderan(editing.id, form);
      } else {
        await store.addOrderan(form);
      }

      // 2. Coba sync ke Google Calendar (silent gagal kalau belum connect).
      try {
        const syncRes = await syncToGoogleCalendar({ ...form, id: editing?.id });
        if (syncRes?.skipped) {
          toast.success(
            editing ? "Orderan diperbarui" : "Orderan baru ditambahkan",
            {
              description:
                "Google Calendar belum terhubung. Hubungkan di halaman Profil supaya event otomatis dibuat.",
            },
          );
        } else if (syncRes?.ok) {
          // Simpan google_event_id ke store kalau baru dibuat.
          if (!editing && "google_event_id" in syncRes && syncRes.google_event_id) {
            // Cari orderan terakhir yang baru diadd (matching by content) dan update
            // dengan google_event_id. Store belum expose "return id from add", jadi
            // fallback: cari yang paling baru dengan nama+wa+tanggal sama.
            const state = store.getState();
            const created = [...state.orderan]
              .reverse()
              .find(
                (o) =>
                  o.nama_pelanggan === form.nama_pelanggan &&
                  o.no_wa === form.no_wa &&
                  o.tanggal === form.tanggal &&
                  !o.google_event_id,
              );
            if (created) {
              await store.updateOrderan(created.id, {
                google_event_id: syncRes.google_event_id,
              });
            }
          }
          toast.success(
            editing
              ? "Orderan diperbarui & Google Calendar disinkron"
              : "Orderan ditambahkan & event Google Calendar dibuat",
          );
        }
      } catch (calErr: any) {
        console.error("[Calendar sync]", calErr);
        toast.warning(
          editing ? "Orderan diperbarui, tapi sync Calendar gagal" : "Orderan ditambahkan, tapi sync Calendar gagal",
          { description: calErr?.message || "Cek koneksi Google Calendar di Profil." },
        );
      }

      onOpenChange(false);
    } finally {
      setSyncing(false);
    }
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
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Email Pelanggan <span className="text-xs text-muted-foreground">(opsional — untuk invite Google Calendar)</span></Label>
            <Input
              type="email"
              value={form.email_pelanggan ?? ""}
              onChange={(e) => set("email_pelanggan", e.target.value)}
              placeholder="pelanggan@email.com"
            />
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
          <div className="space-y-1.5">
            <Label>Spare Part yang Digunakan</Label>
            <Select
              value={selectedSparePartId}
              onValueChange={(v) => {
                if (v === "none") {
                  set("spare_parts", []);
                } else {
                  set("spare_parts", [{ sparepart_id: v, qty: selectedQty }]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih spare part (Opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak ada</SelectItem>
                {spareparts.map((sp) => (
                  <SelectItem key={sp.id} value={sp.id} disabled={sp.stok === 0}>
                    {sp.nama} (Stok: {sp.stok} {sp.satuan}) {sp.stok === 0 ? "— Habis" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Jumlah Spare Part</Label>
            <Input
              type="number"
              min={1}
              disabled={selectedSparePartId === "none"}
              value={selectedQty}
              onChange={(e) => {
                const qty = Math.max(1, parseInt(e.target.value) || 1);
                set("spare_parts", [{ sparepart_id: selectedSparePartId, qty }]);
              }}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Keluhan</Label>
            <Textarea value={form.keluhan} onChange={(e) => set("keluhan", e.target.value)} placeholder="Deskripsi keluhan / servis yang diminta" rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={syncing}>Batal</Button>
          <Button onClick={submit} disabled={syncing}>
            {syncing ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Orderan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
