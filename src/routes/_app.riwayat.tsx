import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Search, ShieldCheck, ShieldAlert, History, Phone, MapPin, Wrench, ChevronRight, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/dataStore";
import { cekGaransi, type RiwayatKerusakan } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/riwayat")({
  head: () => ({ meta: [{ title: "Riwayat & Garansi — CoolService" }] }),
  component: RiwayatPage,
});

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

interface PelangganRow {
  no_wa: string;
  nama: string;
  alamat: string;
  total: number;
  terakhir: string;
  garansi: RiwayatKerusakan | null;
}

function RiwayatPage() {
  const riwayat = useStore((s) => s.riwayat);
  const teknisi = useStore((s) => s.teknisi);
  const orderan = useStore((s) => s.orderan);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const pelanggan: PelangganRow[] = useMemo(() => {
    const m = new Map<string, PelangganRow>();
    for (const r of riwayat) {
      const ex = m.get(r.no_wa);
      if (!ex) {
        m.set(r.no_wa, {
          no_wa: r.no_wa, nama: r.nama_pelanggan, alamat: r.alamat,
          total: 1, terakhir: r.tanggal_selesai,
          garansi: cekGaransi(r.no_wa, new Date().toISOString().slice(0, 10), riwayat),
        });
      } else {
        ex.total += 1;
        if (r.tanggal_selesai > ex.terakhir) ex.terakhir = r.tanggal_selesai;
      }
    }
    return Array.from(m.values())
      .filter((p) => !q || p.nama.toLowerCase().includes(q.toLowerCase()) || p.no_wa.includes(q))
      .sort((a, b) => b.terakhir.localeCompare(a.terakhir));
  }, [riwayat, q]);

  // Komplain dengan flag garansi otomatis (dari tabel Orderan yang belum selesai)
  const komplainGaransi = useMemo(() => {
    return orderan
      .filter((o) => o.status !== "Selesai")
      .map((o) => ({ orderan: o, garansi: cekGaransi(o.no_wa, o.tanggal, riwayat) }))
      .filter((x) => x.garansi !== null);
  }, [orderan, riwayat]);

  const findTek = (id: string | null) => teknisi.find((t) => t.id === id)?.nama ?? "—";

  if (selected) {
    const p = pelanggan.find((x) => x.no_wa === selected);
    const items = riwayat
      .filter((r) => r.no_wa === selected)
      .sort((a, b) => b.tanggal_selesai.localeCompare(a.tanggal_selesai));
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{p?.nama}</h1>
            <p className="text-sm text-muted-foreground inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><Phone className="size-3" />{p?.no_wa}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{p?.alamat}</span>
            </p>
          </div>
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
          {items.map((r) => {
            const expiry = new Date(parseISO(r.tanggal_selesai));
            expiry.setDate(expiry.getDate() + r.garansi_hari);
            const sisaHari = differenceInDays(expiry, new Date());
            const aktif = sisaHari >= 0;
            return (
              <div key={r.id} className="relative bg-card border border-border rounded-2xl p-5 shadow-sm">
                <span className={cn("absolute -left-[18px] top-6 size-3 rounded-full ring-4 ring-background",
                  aktif ? "bg-success" : "bg-muted")} />
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{r.jenis_kerusakan}</h3>
                      {aktif ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold">
                          <ShieldCheck className="size-3" />Garansi aktif ({sisaHari} hari lagi)
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          Garansi berakhir
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{r.tindakan}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span className="capitalize">{format(parseISO(r.tanggal_selesai), "d MMM yyyy", { locale: localeId })}</span>
                      <span className="inline-flex items-center gap-1"><Wrench className="size-3" />{findTek(r.teknisi_id)}</span>
                      <span>Garansi {r.garansi_hari} hari</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{rupiah(r.biaya)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Riwayat & Garansi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Riwayat kerusakan AC per pelanggan dan penanda garansi otomatis.
        </p>
      </div>

      {komplainGaransi.length > 0 && (
        <div className="bg-success/5 border border-success/30 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-9 rounded-xl bg-success text-success-foreground flex items-center justify-center">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h2 className="font-bold">Komplain Masih Dalam Garansi</h2>
              <p className="text-xs text-muted-foreground">
                {komplainGaransi.length} orderan terdeteksi otomatis dari riwayat servis sebelumnya.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {komplainGaransi.map(({ orderan: o, garansi }) => {
              const expiry = new Date(parseISO(garansi!.tanggal_selesai));
              expiry.setDate(expiry.getDate() + garansi!.garansi_hari);
              const sisa = differenceInDays(expiry, new Date());
              return (
                <div key={o.id} className="bg-card border border-success/40 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold">{o.nama_pelanggan}</h4>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold inline-flex items-center gap-1">
                      <ShieldCheck className="size-3" />{sisa} hari
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{o.keluhan}</p>
                  <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                    Servis sebelumnya: <span className="font-medium text-foreground">{garansi!.jenis_kerusakan}</span> ({format(parseISO(garansi!.tanggal_selesai), "d MMM yyyy", { locale: localeId })})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="relative mb-4">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari pelanggan / no WA..." className="pl-9" />
        </div>
        <div className="divide-y divide-border">
          {pelanggan.map((p) => (
            <button
              key={p.no_wa}
              onClick={() => setSelected(p.no_wa)}
              className="w-full flex items-center gap-3 py-3 hover:bg-accent/40 rounded-lg px-2 -mx-2 transition-colors text-left"
            >
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <History className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{p.nama}</span>
                  {p.garansi ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold inline-flex items-center gap-1">
                      <ShieldCheck className="size-3" />Garansi
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground inline-flex items-center gap-1">
                      <ShieldAlert className="size-3" />Tidak ada
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {p.no_wa} • {p.total} servis • terakhir {format(parseISO(p.terakhir), "d MMM yyyy", { locale: localeId })}
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
          {pelanggan.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Belum ada riwayat</div>
          )}
        </div>
      </div>
    </div>
  );
}
