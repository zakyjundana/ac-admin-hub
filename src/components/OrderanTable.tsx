import { Phone, MapPin, MoreVertical, UserCheck, UserX } from "lucide-react";
import type { Orderan, Teknisi } from "@/lib/mockData";
import { STATUS_LIST } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { store } from "@/lib/dataStore";
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
}

export function OrderanTable({ orderan, teknisi, onEdit, emptyText }: Props) {
  if (orderan.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-2xl bg-card/50">
        {emptyText ?? "Belum ada orderan"}
      </div>
    );
  }

  const findTek = (id: string | null) => teknisi.find((t) => t.id === id);

  return (
    <div className="space-y-3">
      {orderan.map((o) => {
        const tek = findTek(o.teknisi_id);
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
              <div className="flex-1 flex items-center gap-2 text-sm">
                {tek ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-success">
                      <UserCheck className="size-4" />
                    </span>
                    <span className="font-medium">{tek.nama}</span>
                    <span className="text-xs text-muted-foreground">({tek.wilayah})</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <UserX className="size-4" /> Belum ditugaskan
                  </span>
                )}
              </div>
              <div className="flex gap-2">
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
