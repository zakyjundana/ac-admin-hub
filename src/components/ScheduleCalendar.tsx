import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Orderan } from "@/lib/mockData";

interface Props {
  orderan: Orderan[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

const statusDot: Record<string, string> = {
  "Belum Selesai": "bg-warning",
  "Dalam Pengerjaan": "bg-primary",
  Selesai: "bg-success",
};

export function ScheduleCalendar({ orderan, selectedDate, onSelectDate }: Props) {
  const [month, setMonth] = useState(startOfMonth(selectedDate));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const byDate = useMemo(() => {
    const m = new Map<string, Orderan[]>();
    for (const o of orderan) {
      const k = o.tanggal;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(o);
    }
    return m;
  }, [orderan]);

  return (
    <div className="bg-card rounded-2xl border border-border p-4 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold capitalize">
          {format(month, "MMMM yyyy", { locale: localeId })}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="px-3 py-2 rounded-lg hover:bg-accent text-xs font-medium transition-colors"
          >
            Hari ini
          </button>
          <button
            onClick={() => setMonth(addMonths(month, 1))}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const items = byDate.get(key) || [];
          const selected = isSameDay(day, selectedDate);
          const outside = !isSameMonth(day, month);
          return (
            <button
              key={key}
              onClick={() => onSelectDate(day)}
              className={cn(
                "aspect-square sm:aspect-auto sm:min-h-[80px] p-1.5 rounded-lg text-left flex flex-col gap-1 border transition-all",
                outside ? "text-muted-foreground/50" : "text-foreground",
                selected
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-transparent hover:border-border hover:bg-accent/50",
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold inline-flex items-center justify-center size-6 rounded-full",
                  isToday(day) && "bg-primary text-primary-foreground",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="flex flex-wrap gap-0.5 mt-auto">
                {items.slice(0, 3).map((o) => (
                  <span
                    key={o.id}
                    className={cn("size-1.5 rounded-full", statusDot[o.status])}
                  />
                ))}
                {items.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{items.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-xs">
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-warning" />Belum Selesai</div>
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" />Dalam Pengerjaan</div>
        <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" />Selesai</div>
      </div>
    </div>
  );
}
