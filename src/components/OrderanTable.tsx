import { Phone, MapPin, MoreVertical, UserCheck, UserX } from "lucide-react";
import type { Orderan, Teknisi } from "@/lib/mockData";
import { STATUS_LIST } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { store, useStore } from "@/lib/dataStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  "Belum Selesai": "bg-warning/15 text-warning-foreground border border-warning/30",
  "Dalam Pengerjaan": "bg-primary/10 text-primary border border-primary/30",
  Selesai: "bg-success/15 text-success border border-success/30",
};

interface Props {
  orderan: Orderan[];
  teknisi: Teknisi[];
  onEdit: (o: Orderan) => void;
  emptyText?: string;
  showKirimJadwal?: boolean;
  showKirimInvoice?: boolean;
}

export function OrderanTable({ orderan, teknisi, onEdit, emptyText, showKirimJadwal, showKirimInvoice }: Props) {
  if (orderan.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-2xl bg-card/50">
        {emptyText ?? "Belum ada orderan"}
      </div>
    );
  }

  const spareparts = useStore((s) => s.sparepart);
  const findTek = (id: string | null) => teknisi.find((t) => t.id === id);

  return (
    <div className="space-y-3">
      {orderan.map((o) => {
        const tek = findTek(o.teknisi_id);
        const usedSp = o.spare_parts?.[0];
        const spDetail = usedSp ? spareparts.find((sp) => sp.id === usedSp.sparepart_id) : null;

        return (
          <div
            key={o.id}
            className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-semibold truncate">{o.nama_pelanggan}</h4>
                  <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", statusStyles[o.status])}>
                    {o.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {o.jam} • {o.wilayah}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{o.keluhan}</p>
                
                {spDetail && usedSp && (
                  <div className="mt-1.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium border border-border/40">
                      Spare Part: {spDetail.nama} ({usedSp.qty} {spDetail.satuan})
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Phone className="size-3" />{o.no_wa}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{o.alamat}</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 shrink-0">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(o)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      store.deleteOrderan(o.id);
                      toast.success("Orderan dihapus");
                    }}
                  >
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-border">
              <div className="flex-1 flex items-center gap-2 text-sm flex-wrap">
                {tek ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-success">
                      <UserCheck className="size-4" />
                    </span>
                    <span className="font-medium">{tek.nama}</span>
                    <span className="text-xs text-muted-foreground">({tek.wilayah})</span>
                    {showKirimJadwal && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 h-7 px-2.5 text-[10px] font-semibold border-primary/20 text-primary hover:bg-primary/5 hover:text-primary transition-all rounded-md"
                        onClick={() => {
                          let formattedPhone = o.no_wa.replace(/[^0-9]/g, "");
                          if (formattedPhone.startsWith("0")) {
                            formattedPhone = "62" + formattedPhone.slice(1);
                          }
                          const pesan = `Halo Bapak/Ibu ${o.nama_pelanggan}, kami dari CoolService mengabarkan bahwa teknisi kami (${tek.nama}) dijadwalkan akan berkunjung ke alamat Anda pada tanggal ${o.tanggal} pukul ${o.jam} WIB untuk menangani keluhan: "${o.keluhan}". Mohon konfirmasinya jika waktu tersebut sudah sesuai. Terima kasih!`;
                          const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(pesan)}`;
                          window.open(url, "_blank");
                          toast.success(`Membuka WhatsApp untuk mengirim jadwal ke ${o.nama_pelanggan}`);
                        }}
                      >
                        Kirim Jadwal via WA
                      </Button>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <UserX className="size-4" /> Belum ditugaskan
                  </span>
                )}
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {showKirimInvoice && o.status === "Selesai" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold border-success/30 hover:bg-success/5 hover:text-success text-success transition-all rounded-md"
                    onClick={() => {
                      let formattedPhone = o.no_wa.replace(/[^0-9]/g, "");
                      if (formattedPhone.startsWith("0")) {
                        formattedPhone = "62" + formattedPhone.slice(1);
                      }
                      const pesan = `Halo Bapak/Ibu ${o.nama_pelanggan}, servis AC Anda dengan keluhan "${o.keluhan}" telah selesai dikerjakan oleh teknisi kami (${tek?.nama || "—"}). Terima kasih telah mempercayai CoolService!`;
                      const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(pesan)}`;
                      window.open(url, "_blank");
                      toast.success(`Membuka WhatsApp untuk mengirim invoice ke ${o.nama_pelanggan}`);
                    }}
                  >
                    Kirim Invoice via WA
                  </Button>
                )}
                <Select
                  value={o.teknisi_id ?? "none"}
                  onValueChange={(v) =>
                    store.updateOrderan(o.id, { teknisi_id: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger className="h-8 text-xs w-full sm:w-44">
                    <SelectValue placeholder="Pilih teknisi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Belum ditugaskan</SelectItem>
                    {teknisi.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={o.status}
                  onValueChange={(v) =>
                    store.updateOrderan(o.id, { status: v as Orderan["status"] })
                  }
                >
                  <SelectTrigger className="h-8 text-xs w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
