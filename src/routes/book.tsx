import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  getDay, 
  addMonths, 
  subMonths, 
  isToday, 
  isSameDay, 
  parseISO,
  isBefore,
  startOfToday
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  Wrench, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  Sparkles,
  Map,
  MessageSquare
} from "lucide-react";
import { useStore, store } from "@/lib/dataStore";
import { WILAYAH_LIST } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      shop: (search.shop as string) || "demo-user-id",
    };
  },
  head: () => ({
    meta: [
      { title: "Booking Jadwal Servis AC Online - CoolService" },
      { name: "description", content: "Pilih tanggal dan waktu kunjungan teknisi untuk servis AC Anda secara online dengan praktis dan cepat." },
      { property: "og:title", content: "Booking Jadwal Servis AC Online - CoolService" },
      { property: "og:description", content: "Pilih tanggal dan waktu kunjungan teknisi untuk servis AC Anda secara online dengan praktis dan cepat." },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const { shop } = Route.useSearch();
  const orderan = useStore((s) => s.orderan); // To trigger reactivity

  // Load shop specific orders dynamically (protecting privacy)
  const shopOrders = useMemo(() => {
    if (typeof window === "undefined") return [];
    if (shop === "demo-user-id") {
      const saved = localStorage.getItem("coolservice_store_demo-user-id");
      if (saved) {
        try { return JSON.parse(saved).orderan || []; } catch {}
      }
      return store.getState().orderan;
    }
    const saved = localStorage.getItem("coolservice_store_" + shop);
    if (saved) {
      try {
        return JSON.parse(saved).orderan || [];
      } catch {}
    }
    return [];
  }, [shop, orderan]);

  // Load shop business name
  const namaBisnis = useMemo(() => {
    if (typeof window === "undefined") return "CoolService";
    if (shop === "demo-user-id") return "CoolService Mandiri";
    const saved = localStorage.getItem("coolservice_store_" + shop);
    // Try to get from auth or fallback
    return "CoolService AC";
  }, [shop]);

  // Calendar States
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Calendar, 2: Form, 3: Success

  // Form States
  const [form, setForm] = useState({
    nama: "",
    no_wa: "",
    alamat: "",
    wilayah: WILAYAH_LIST[0],
    keluhan: "",
    waktu: "09:00 - 12:00 (Pagi)"
  });

  // Calculate days for the grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.

  // Convert to Indonesian grid (Monday first)
  const mondayOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Previous and next month handlers
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Check availability status of a day
  const getDayAvailability = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const count = shopOrders.filter((o) => o.tanggal === key).length;
    
    if (count >= 5) return { status: "penuh", label: "Penuh", color: "bg-red-500" };
    if (count >= 2) return { status: "terbatas", label: "Slot Terbatas", color: "bg-amber-500" };
    return { status: "tersedia", label: "Tersedia", color: "bg-green-500" };
  };

  const handleDateClick = (date: Date) => {
    // Cannot book past dates
    if (isBefore(date, startOfToday())) {
      toast.error("Tidak bisa memilih tanggal di masa lalu");
      return;
    }

    const avail = getDayAvailability(date);
    if (avail.status === "penuh") {
      toast.error("Maaf, jadwal untuk hari tersebut sudah penuh. Silakan pilih hari lain.");
      return;
    }

    setSelectedDate(date);
    setStep(2);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    if (!form.nama || !form.no_wa || !form.alamat || !form.keluhan) {
      toast.error("Mohon lengkapi semua bidang isian");
      return;
    }

    // Prepare time slot value
    const timeOnly = form.waktu.split(" ")[0]; // e.g. "09:00"

    // Submit client booking to the store
    store.addClientBooking(shop, {
      nama_pelanggan: form.nama,
      no_wa: form.no_wa,
      alamat: form.alamat,
      wilayah: form.wilayah,
      keluhan: form.keluhan,
      status: "Belum Selesai",
      teknisi_id: null,
      tanggal: format(selectedDate, "yyyy-MM-dd"),
      jam: timeOnly,
    });

    setStep(3);
    toast.success("Booking berhasil dikirim!");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-between p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      <Toaster richColors position="top-center" />
      {/* Background Blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-lg text-center py-4 relative z-10 flex flex-col items-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg shadow-primary/20 mb-3 animate-pulse">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">{namaBisnis}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Sistem Booking Servis AC Online Mandiri</p>
      </header>

      {/* Content Area */}
      <main className="w-full max-w-lg relative z-10 my-6 flex-1 flex flex-col justify-center">
        {/* STEP 1: CALENDAR SELECTION */}
        {step === 1 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Pilih Tanggal Servis AC
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Silakan pilih tanggal yang tersedia pada kalender di bawah.</p>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-2 rounded-xl">
              <button onClick={prevMonth} aria-label="Bulan sebelumnya" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: localeId })}
              </span>
              <button onClick={nextMonth} aria-label="Bulan berikutnya" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-1">
              {/* Days label */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-500 py-1 uppercase tracking-wider">
                <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
              </div>

              {/* Days container */}
              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty cells for Monday offset */}
                {Array.from({ length: mondayOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-square" />
                ))}

                {/* Days of current month */}
                {daysInMonth.map((day) => {
                  const isPast = isBefore(day, startOfToday());
                  const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                  const isCurrentDay = isToday(day);
                  const avail = getDayAvailability(day);

                  return (
                    <button
                      key={day.toString()}
                      disabled={isPast || avail.status === "penuh"}
                      onClick={() => handleDateClick(day)}
                      className={`
                        relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all group
                        ${isPast 
                          ? "text-gray-600 cursor-not-allowed opacity-30" 
                          : avail.status === "penuh" 
                          ? "bg-red-500/5 text-red-400/50 border border-red-500/20 cursor-not-allowed"
                          : "hover:scale-105 active:scale-95"
                        }
                        ${isCurrentDay && !isSelected && "border border-primary/40 bg-primary/5 text-primary"}
                        ${isSelected 
                          ? "bg-primary text-white shadow-lg shadow-primary/30" 
                          : !isPast && avail.status !== "penuh" && "bg-white/[0.03] border border-white/5 hover:border-white/20 text-white"
                        }
                      `}
                    >
                      <span>{format(day, "d")}</span>
                      
                      {/* Availability dot indicator */}
                      {!isPast && avail.status !== "penuh" && (
                        <span className={`absolute bottom-1.5 size-1.5 rounded-full ${avail.color}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend indicators */}
            <div className="flex justify-center gap-4 text-[10px] text-gray-400 pt-3 border-t border-white/5">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-green-500" />Tersedia</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" />Terbatas</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" />Penuh / Libur</span>
            </div>
          </div>
        )}

        {/* STEP 2: BOOKING FORM */}
        {step === 2 && selectedDate && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary animate-pulse" />
                  Isi Formulir Booking
                </h2>
                <p className="text-[11px] text-primary mt-0.5">
                  Tanggal terpilih: <strong>{format(selectedDate, "EEEE, d MMMM yyyy", { locale: localeId })}</strong>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-white"
                onClick={() => setStep(1)}
              >
                Ubah Tanggal
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nama" className="text-xs font-semibold text-gray-300">Nama Lengkap Anda</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="nama"
                    name="nama"
                    required
                    value={form.nama}
                    onChange={handleFormChange}
                    placeholder="Bapak/Ibu Ahmad"
                    className="pl-10 text-xs bg-white/[0.04] border-white/10 focus:border-primary/50 text-white placeholder-gray-600 rounded-xl py-2.5 h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="no_wa" className="text-xs font-semibold text-gray-300">Nomor WhatsApp Aktif</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    id="no_wa"
                    name="no_wa"
                    type="tel"
                    required
                    value={form.no_wa}
                    onChange={handleFormChange}
                    placeholder="08123456789"
                    className="pl-10 text-xs bg-white/[0.04] border-white/10 focus:border-primary/50 text-white placeholder-gray-600 rounded-xl py-2.5 h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wilayah" className="text-xs font-semibold text-gray-300">Wilayah / Kota</Label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                  <select
                    id="wilayah"
                    name="wilayah"
                    value={form.wilayah}
                    onChange={handleFormChange}
                    className="w-full bg-[#0d0d13] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-all h-10"
                  >
                    {WILAYAH_LIST.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alamat" className="text-xs font-semibold text-gray-300">Alamat Lengkap Kunjungan</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <textarea
                    id="alamat"
                    name="alamat"
                    required
                    value={form.alamat}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="Tuliskan alamat lengkap beserta nomor rumah & patokan jalan..."
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="waktu" className="text-xs font-semibold text-gray-300">Pilihan Slot Waktu</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                  <select
                    id="waktu"
                    name="waktu"
                    value={form.waktu}
                    onChange={handleFormChange}
                    className="w-full bg-[#0d0d13] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-all h-10"
                  >
                    <option value="09:00 - 12:00 (Pagi)">09:00 - 12:00 WIB (Pagi)</option>
                    <option value="13:00 - 15:00 (Siang)">13:00 - 15:00 WIB (Siang)</option>
                    <option value="16:00 - 18:00 (Sore)">16:00 - 18:00 WIB (Sore)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="keluhan" className="text-xs font-semibold text-gray-300">Keluhan AC / Jenis Jasa</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <textarea
                    id="keluhan"
                    name="keluhan"
                    required
                    value={form.keluhan}
                    onChange={handleFormChange}
                    rows={2}
                    placeholder="Contoh: AC kurang dingin, butuh cuci AC rutin, atau AC mati total..."
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold rounded-xl py-3.5 shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform text-xs"
              >
                Kirim Pemesanan Sekarang
              </Button>
            </form>
          </div>
        )}

        {/* STEP 3: SUCCESS PAGE */}
        {step === 3 && selectedDate && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in scale-in duration-300">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto shadow-lg shadow-green-500/5">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Booking Berhasil Dikirim!</h2>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Pemesanan Anda untuk tanggal <strong>{format(selectedDate, "d MMMM yyyy", { locale: localeId })}</strong> telah terdaftar di sistem kami.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left space-y-2 text-xs text-gray-300">
              <div className="flex justify-between"><span className="text-gray-500">Nama:</span> <span className="font-semibold">{form.nama}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">WhatsApp:</span> <span className="font-semibold">{form.no_wa}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Waktu Kunjungan:</span> <span className="font-semibold text-primary">{form.waktu}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Jasa:</span> <span className="font-semibold line-clamp-1">{form.keluhan}</span></div>
            </div>

            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10 text-[10px] text-primary leading-normal max-w-xs mx-auto">
              Admin kami akan segera menghubungi Anda melalui nomor WhatsApp di atas untuk mengonfirmasi jadwal & menugaskan teknisi.
            </div>

            <Button
              onClick={() => {
                setForm({
                  nama: "",
                  no_wa: "",
                  alamat: "",
                  wilayah: WILAYAH_LIST[0],
                  keluhan: "",
                  waktu: "09:00 - 12:00 (Pagi)"
                });
                setSelectedDate(null);
                setStep(1);
              }}
              className="w-full bg-white/10 hover:bg-white/15 text-white text-xs rounded-xl"
            >
              Kembali ke Kalender Booking
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-4 relative z-10 text-[10px] text-gray-600">
        © 2026 {namaBisnis}. Powered by CoolService.
      </footer>
    </div>
  );
}
