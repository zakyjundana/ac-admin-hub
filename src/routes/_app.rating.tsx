import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { 
  Star, 
  MessageSquare, 
  AlertCircle, 
  ThumbsUp, 
  User, 
  CalendarDays,
  Search,
  Filter,
  CheckCircle2
} from "lucide-react";
import { useStore } from "@/lib/dataStore";
import { type Feedback, type Teknisi } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_app/rating")({
  head: () => ({ meta: [{ title: "Rating & Feedback — CoolService" }] }),
  component: RatingPage,
});

const StarRating = ({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) => {
  const sizeClass = size === "sm" ? "size-3" : "size-4";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const active = i < Math.round(rating);
        return (
          <Star
            key={i}
            className={`${sizeClass} ${active ? "fill-warning text-warning" : "text-border fill-muted/20"}`}
          />
        );
      })}
    </div>
  );
};

function RatingPage() {
  const teknisi = useStore((s) => s.teknisi);
  const feedback = useStore((s) => s.feedback);
  const orderan = useStore((s) => s.orderan);

  // States
  const [selectedTeknisiId, setSelectedTeknisiId] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate technician stats
  const performanceStats = useMemo(() => {
    return teknisi.map((t) => {
      const tFeedback = feedback.filter((f) => f.teknisi_id === t.id);
      const totalRatings = tFeedback.length;
      const avgRating = totalRatings > 0 
        ? Math.round((tFeedback.reduce((sum, f) => sum + f.rating, 0) / totalRatings) * 10) / 10
        : 0;

      const complaintsCount = tFeedback.filter((f) => f.is_komplain || f.rating <= 3).length;
      
      // Determine performance badge/status
      let status = "Belum Ada Rating";
      let statusColor = "text-muted-foreground bg-accent";
      if (totalRatings > 0) {
        if (avgRating >= 4.5) {
          status = "Sangat Memuaskan";
          statusColor = "text-success bg-success/10 border-success/20";
        } else if (avgRating >= 3.5) {
          status = "Cukup Baik";
          statusColor = "text-primary bg-primary/10 border-primary/20";
        } else {
          status = "Perlu Peningkatan";
          statusColor = "text-destructive bg-destructive/10 border-destructive/20";
        }
      }

      return {
        ...t,
        avgRating,
        totalRatings,
        complaintsCount,
        status,
        statusColor,
      };
    });
  }, [teknisi, feedback]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const total = feedback.length;
    const avg = total > 0 ? Math.round((feedback.reduce((sum, f) => sum + f.rating, 0) / total) * 10) / 10 : 0;
    const komplain = feedback.filter((f) => f.is_komplain || f.rating <= 3).length;
    const puas = feedback.filter((f) => f.rating >= 4).length;

    return {
      total,
      avg,
      komplain,
      puas,
      puasPercentage: total > 0 ? Math.round((puas / total) * 100) : 0,
    };
  }, [feedback]);

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    return feedback.filter((f) => {
      const matchTeknisi = selectedTeknisiId === "all" || f.teknisi_id === selectedTeknisiId;
      const matchRating = selectedRating === "all" || f.rating.toString() === selectedRating;
      
      const tek = teknisi.find((t) => t.id === f.teknisi_id);
      const matchSearch = 
        f.nama_pelanggan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.ulasan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tek && tek.nama.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchTeknisi && matchRating && matchSearch;
    }).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [feedback, selectedTeknisiId, selectedRating, searchQuery, teknisi]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Rating & Feedback</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pantau kepuasan pelanggan, ulasan keluhan, dan performa individual teknisi berdasarkan rating lapangan.
        </p>
      </div>

      {/* Satisfaction Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-warning-foreground uppercase tracking-wider">
              Rating Rata-rata
            </span>
            <Star className="size-5 text-warning fill-warning" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">{overallStats.avg}</span>
            <span className="text-xs text-muted-foreground">/ 5.0</span>
          </div>
          <div className="mt-2 text-xs">
            <StarRating rating={overallStats.avg} size="sm" />
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Total Ulasan Masuk
            </span>
            <MessageSquare className="size-5 text-primary" />
          </div>
          <div className="text-3xl font-bold text-foreground">{overallStats.total}</div>
          <p className="text-xs text-muted-foreground mt-2">Ulasan kepuasan terkumpul</p>
        </div>

        {/* Satisfied Clients Ratio */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-success uppercase tracking-wider">
              Rasio Kepuasan
            </span>
            <ThumbsUp className="size-5 text-success" />
          </div>
          <div className="text-3xl font-bold text-foreground">{overallStats.puasPercentage}%</div>
          <p className="text-xs text-muted-foreground mt-2">
            {overallStats.puas} pelanggan memberi bintang 4-5
          </p>
        </div>

        {/* Active Complaints */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-destructive uppercase tracking-wider">
              Komplain / Masukan Kritis
            </span>
            <AlertCircle className="size-5 text-destructive" />
          </div>
          <div className="text-3xl font-bold text-foreground">{overallStats.komplain}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Bintang ≤ 3 atau ditandai komplain
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Technician Performance Summary */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-6 shadow-sm h-fit">
          <div className="border-b border-border pb-3 mb-4">
            <h3 className="text-lg font-bold">Ringkasan Performa Teknisi</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Evaluasi kinerja berdasarkan rating bintang dari pekerjaan yang diselesaikan.
            </p>
          </div>

          <div className="space-y-4">
            {performanceStats.map((stat) => (
              <div 
                key={stat.id} 
                className="p-4 rounded-xl border border-border bg-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-foreground">{stat.nama}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Zoning: {stat.wilayah}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-warning-foreground bg-warning/10 px-1.5 py-0.5 rounded">
                      ★ {stat.avgRating || "0.0"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">({stat.totalRatings} Ulasan)</span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 flex flex-col gap-1 sm:items-end">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${stat.statusColor}`}>
                    {stat.status}
                  </span>
                  {stat.complaintsCount > 0 && (
                    <span className="text-[10px] text-destructive font-medium mt-1 inline-flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {stat.complaintsCount} Masukan Kritis
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Customer Review Lists */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-bold">Ulasan & Kritik Pelanggan</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daftar feedback dari pelanggan yang masuk ke sistem.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-accent/30 p-4 rounded-xl border border-border/40">
            {/* Search */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-semibold">Cari Kata Kunci</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Pelanggan, ulasan, teknisi..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>
            </div>

            {/* Teknisi Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-semibold">Pilih Teknisi</Label>
              <Select value={selectedTeknisiId} onValueChange={setSelectedTeknisiId}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Semua Teknisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Teknisi</SelectItem>
                  {teknisi.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rating Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-semibold">Filter Rating</Label>
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Semua Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Rating</SelectItem>
                  <SelectItem value="5">★ 5 (Sempurna)</SelectItem>
                  <SelectItem value="4">★ 4 (Bagus)</SelectItem>
                  <SelectItem value="3">★ 3 (Cukup)</SelectItem>
                  <SelectItem value="2">★ 2 (Kurang)</SelectItem>
                  <SelectItem value="1">★ 1 (Buruk)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Feedback Cards */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredFeedbacks.map((f) => {
              const tek = teknisi.find((t) => t.id === f.teknisi_id);
              const badgeKomplain = f.is_komplain || f.rating <= 3;
              return (
                <div 
                  key={f.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    badgeKomplain 
                      ? "border-destructive/30 bg-destructive/5" 
                      : "border-border bg-accent/10"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {f.nama_pelanggan.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-xs">{f.nama_pelanggan}</span>
                        {badgeKomplain ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-semibold text-destructive px-1.5 py-0.5 rounded bg-destructive/10">
                            <AlertCircle className="size-2.5" /> Komplain
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-semibold text-success px-1.5 py-0.5 rounded bg-success/10">
                            <CheckCircle2 className="size-2.5" /> Puas
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <CalendarDays className="size-3" />
                      <span>{f.tanggal}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <StarRating rating={f.rating} size="sm" />
                  </div>

                  <p className="text-xs text-foreground italic">"{f.ulasan}"</p>

                  <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3" />
                      Teknisi: <strong className="text-foreground">{tek?.nama || "Tidak Ditetapkan"}</strong>
                    </span>
                    <span>Order ID: {f.orderan_id}</span>
                  </div>
                </div>
              );
            })}

            {filteredFeedbacks.length === 0 && (
              <div className="text-center py-12 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                Tidak ada ulasan yang sesuai dengan kriteria filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
