import { Phone, MapPin, MoreVertical, UserCheck, UserX, Share2, Copy, Send, MessageSquare } from "lucide-react";
import type { Orderan, Teknisi } from "@/lib/mockData";
import { STATUS_LIST } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { store, useStore } from "@/lib/dataStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useState } from "react";


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

  const { user } = useAuth();
  const [sharingData, setSharingData] = useState<{
    order: Orderan;
    tek: Teknisi | null;
    type: "jadwal" | "invoice";
  } | null>(null);
  const [pesanShare, setPesanShare] = useState("");

  const formatTanggalIndo = (tglStr: string) => {
    try {
      return format(parseISO(tglStr), "EEEE, d MMMM yyyy", { locale: localeId });
    } catch {
      return tglStr;
    }
  };

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
                        className="ml-2 h-7 px-2.5 text-[10px] font-semibold border-primary/20 text-primary hover:bg-primary/5 hover:text-primary transition-all rounded-md flex items-center gap-1"
                        onClick={() => {
                          const tglIndo = formatTanggalIndo(o.tanggal);
                          const namaBisnis = user?.namaBisnis || "CoolService";
                          const template = `Halo Bapak/Ibu ${o.nama_pelanggan},\n\nKami dari ${namaBisnis} mengabarkan bahwa teknisi kami dijadwalkan akan berkunjung ke tempat Anda:\n\n📅 Hari/Tgl: ${tglIndo}\n⏰ Jam: ${o.jam} WIB\n🛠️ Pekerjaan: ${o.keluhan}\n👨‍🔧 Teknisi: ${tek.nama} (${tek.no_hp})\n\nMohon konfirmasinya jika waktu tersebut sudah sesuai. Terima kasih!`;
                          setSharingData({ order: o, tek: tek ?? null, type: "jadwal" });
                          setPesanShare(template);
                        }}
                      >
                        <Share2 className="size-3" /> Kirim Jadwal
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
                    className="h-8 text-xs font-semibold border-success/30 hover:bg-success/5 hover:text-success text-success transition-all rounded-md flex items-center gap-1"
                    onClick={() => {
                      const tglIndo = formatTanggalIndo(o.tanggal);
                      const namaBisnis = user?.namaBisnis || "CoolService";
                      
                      const isCuci = o.keluhan.toLowerCase().includes("cuci") || o.keluhan.toLowerCase().includes("cleaning") || o.keluhan.toLowerCase().includes("clean") || o.keluhan.toLowerCase().includes("perawatan");
                      const serviceFee = isCuci ? 75000 : 250000;
                      let partsFee = 0;
                      if (o.spare_parts) {
                        for (const p of o.spare_parts) {
                          const sp = spareparts.find((item) => item.id === p.sparepart_id);
                          if (sp) {
                            partsFee += sp.harga * p.qty;
                          }
                        }
                      }
                      const totalBiaya = serviceFee + partsFee;
                      const rupiahCost = "Rp " + totalBiaya.toLocaleString("id-ID");

                      const template = `Halo Bapak/Ibu ${o.nama_pelanggan},\n\nTerima kasih telah menggunakan jasa ${namaBisnis}.\n\nServis AC Anda untuk pekerjaan "${o.keluhan}" telah selesai dikerjakan oleh teknisi kami (${tek?.nama || "—"}).\n\nDetail Transaksi:\n📅 Tanggal Selesai: ${tglIndo}\n💰 Total Biaya: ${rupiahCost}\n🛡️ Garansi: 30 Hari sejak pengerjaan\n\nSemoga Anda puas dengan layanan kami. Terima kasih!`;
                      setSharingData({ order: o, tek: tek ?? null, type: "invoice" });
                      setPesanShare(template);
                    }}
                  >
                    <Send className="size-3" /> Kirim Invoice
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

      <Dialog open={!!sharingData} onOpenChange={(open) => !open && setSharingData(null)}>
        <DialogContent className="max-w-md bg-[#0f0f15] border border-white/5 text-white shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              {sharingData?.type === "jadwal" ? "Bagikan Jadwal Servis" : "Kirim Invoice & Detail Servis"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-400">
              Sesuaikan isi pesan di bawah ini sebelum dikirim ke pelanggan via WhatsApp atau disalin.
            </p>
            <textarea
              value={pesanShare}
              onChange={(e) => setPesanShare(e.target.value)}
              rows={8}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all resize-none leading-relaxed"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full sm:flex-1 text-xs flex items-center justify-center gap-1.5 border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white"
              onClick={() => {
                navigator.clipboard.writeText(pesanShare);
                toast.success("Pesan berhasil disalin ke clipboard!");
              }}
            >
              <Copy className="size-3.5" /> Salin Pesan
            </Button>
            
            {typeof navigator !== "undefined" && navigator.share && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full sm:flex-1 text-xs flex items-center justify-center gap-1.5 border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white"
                onClick={() => {
                  navigator.share({
                    text: pesanShare
                  }).catch(() => {});
                }}
              >
                <Share2 className="size-3.5" /> Bagikan
              </Button>
            )}

            <Button
              size="sm"
              className="w-full sm:flex-1 text-xs flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white font-bold"
              onClick={() => {
                if (!sharingData) return;
                let formattedPhone = sharingData.order.no_wa.replace(/[^0-9]/g, "");
                if (formattedPhone.startsWith("0")) {
                  formattedPhone = "62" + formattedPhone.slice(1);
                }
                const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(pesanShare)}`;
                window.open(url, "_blank");
                toast.success(`Membuka WhatsApp untuk mengirim pesan`);
                setSharingData(null);
              }}
            >
              <Send className="size-3.5" /> Kirim WA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
