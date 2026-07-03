import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wrench,
  Calendar,
  BarChart3,
  Package,
  MessageCircle,
  Star,
  Shield,
  ChevronRight,
  CheckCircle2,
  Phone,
  MapPin,
  Users,
  Zap,
  TrendingUp,
  Award,
  Mail,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoolService - Kelola Teknisi & Orderan AC Lebih Rapi" },
      { name: "description", content: "Aplikasi manajemen operasional bisnis service AC terlengkap di Indonesia. Atur jadwal teknisi, invoice, and monitoring stok dalam satu dashboard." },
      { property: "og:title", content: "CoolService - Kelola Teknisi & Orderan AC Lebih Rapi" },
      { property: "og:description", content: "Aplikasi manajemen operasional bisnis service AC terlengkap di Indonesia." },
      { property: "og:url", content: "https://coolboard.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://coolboard.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "CoolService",
          url: "https://coolboard.lovable.app",
          telephone: "+62-21-0000-0000",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Komplek Bintara Jaya Permai Blok C280, Bintara, Bekasi Barat",
            addressLocality: "Kota Bekasi",
            addressRegion: "Jawa Barat",
            addressCountry: "ID",
          },
          areaServed: "Indonesia",
        }),
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: Calendar,
    title: "Jadwal Pintar",
    desc: "Kelola jadwal harian & bulanan semua teknisi dalam satu tampilan. Assign orderan ke teknisi sesuai wilayah dalam hitungan detik.",
  },
  {
    icon: MessageCircle,
    title: "Notifikasi WhatsApp Otomatis",
    desc: "Kirim jadwal, konfirmasi, dan invoice ke pelanggan via link WA satu klik. Tanpa biaya gateway tambahan.",
  },
  {
    icon: Package,
    title: "Stok Spare Part Otomatis",
    desc: "Stok terpotong otomatis saat orderan selesai. Dapat peringatan ketika stok hampir habis.",
  },
  {
    icon: BarChart3,
    title: "Laporan Keuangan Real-time",
    desc: "Lihat pemasukan, pengeluaran, dan laba bersih setiap bulan dalam grafik yang mudah dipahami.",
  },
  {
    icon: Shield,
    title: "Manajemen Garansi",
    desc: "Sistem deteksi otomatis masa garansi aktif. Komplain garansi langsung Rp 0 tanpa hitung manual.",
  },
  {
    icon: Star,
    title: "Rating & Insentif Teknisi",
    desc: "Pantau kepuasan pelanggan per teknisi. Hitung insentif otomatis berdasarkan kinerja harian.",
  },
];

const pricing = [
  {
    name: "Gratis",
    price: "Rp 0",
    period: "/bulan",
    highlight: false,
    badge: null,
    features: [
      "1 Teknisi",
      "Input orderan pelanggan",
      "Jadwal & kalender dasar",
      "Notifikasi WA manual",
      "Riwayat servis",
    ],
    cta: "Mulai Gratis",
    ctaLink: "/register",
  },
  {
    name: "Starter",
    price: "Rp 99.000",
    period: "/bulan",
    highlight: true,
    badge: "Paling Populer",
    features: [
      "Maks 3 Teknisi",
      "Semua fitur Gratis",
      "Manajemen stok spare part",
      "Riwayat servis lengkap",
      "Filter wilayah / zoning",
      "Laporan keuangan dasar",
    ],
    cta: "Coba Gratis 14 Hari",
    ctaLink: "/register",
  },
  {
    name: "Pro",
    price: "Rp 199.000",
    period: "/bulan",
    highlight: false,
    badge: null,
    features: [
      "Teknisi tidak terbatas",
      "Semua fitur Starter",
      "Laporan keuangan lengkap",
      "Manajemen garansi otomatis",
      "Rating & evaluasi teknisi",
      "Kalkulator insentif harian",
      "Export laporan ke PDF",
    ],
    cta: "Mulai Pro",
    ctaLink: "/register",
  },
];

const testimonials = [
  {
    name: "Pak Budi",
    kota: "Bekasi",
    rating: 5,
    text: "Dulu catat orderan di buku, sekarang semua dari HP. Teknisi saya jadi lebih tertib dan pelanggan puas.",
  },
  {
    name: "Pak Andi",
    kota: "Tangerang",
    rating: 5,
    text: "Yang paling membantu itu laporan keuangan. Langsung tahu bulan ini untung berapa tanpa hitung manual.",
  },
  {
    name: "Bu Sari",
    kota: "Depok",
    rating: 5,
    text: "Kirim jadwal ke pelanggan tinggal klik, langsung masuk WhatsApp. Pelanggan senang, kita juga lebih profesional.",
  },
];

export default function LandingPage() {
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "CoolService",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "IDR"
    },
    "description": "Aplikasi manajemen operasional bisnis service AC terlengkap di Indonesia. Atur jadwal teknisi, invoice, dan monitoring stok dalam satu dashboard."
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#0a0a0f]/80 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">CoolService</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#fitur" className="hover:text-white transition-colors">Fitur</a>
          <a href="#testimoni" className="hover:text-white transition-colors">Testimoni</a>
          <a href="#testimoni" className="hover:text-white transition-colors">Testimoni</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Masuk
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-4 py-2 rounded-lg transition-all"
          >
            Daftar Gratis
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-24 px-6 overflow-hidden">
          {/* BG Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>Khusus untuk usaha servis AC di Indonesia</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Kelola Teknisi &{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Orderan AC
            </span>{" "}
            Lebih Rapi
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Dari input orderan, jadwal teknisi, stok spare part, hingga laporan keuangan —
            semua dikelola dalam satu aplikasi. Lebih profesional, lebih efisien.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
            >
              Mulai Gratis Sekarang
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
             <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-400 hover:text-white px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all text-sm"
            >
              Lihat Demo Dashboard
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Tanpa kartu kredit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Setup 5 menit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Gratis selamanya untuk 1 teknisi</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { icon: Users, value: "500+", label: "Usaha Terdaftar" },
            { icon: TrendingUp, value: "98%", label: "Kepuasan Pengguna" },
            { icon: Award, value: "4.9★", label: "Rating di Play Store" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center py-5 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur"
            >
              <stat.icon className="w-5 h-5 text-blue-400 mb-2" />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Semua yang Dibutuhkan Usaha Servis AC
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Dirancang khusus untuk kebutuhan nyata tukang AC — bukan software kantor yang dimodifikasi.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4 group-hover:bg-blue-500/25 transition-colors">
                  <f.icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing section disembunyikan — semua fitur sedang gratis */}

      {/* Testimonials */}
      <section id="testimoni" className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Kata Mereka yang Sudah Pakai
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {t.kota}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/30">
            <h2 className="text-3xl font-bold mb-4">
              Siap Kelola Usaha AC Lebih Profesional?
            </h2>
            <p className="text-gray-400 mb-8">
              Bergabung bersama ratusan usaha servis AC yang sudah lebih teratur dengan CoolService.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:scale-[1.02]"
            >
              Daftar Gratis Sekarang
              <ChevronRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-gray-500 mt-4">
              Tidak perlu kartu kredit • Bisa upgrade kapanpun
            </p>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-[#0a0a0f]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-200 text-lg">CoolService</span>
            </div>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed max-w-sm">
              Aplikasi manajemen operasional bisnis service AC terlengkap di Indonesia. 
              Membantu tukang AC menjadi lebih profesional dan teratur.
            </p>
            <p className="text-sm text-gray-500">© 2026 CoolService. Hak Cipta Dilindungi.</p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Informasi Kontak</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">Komplek Bintara Jaya Permai Blok C280, Bintara, Bekasi Barat, Kota Bekasi, Jawa Barat</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <a href="mailto:zakyjundana@gmail.com" className="hover:text-white transition-colors">zakyjundana@gmail.com</a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <a href="https://wa.me/6285174284456" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">0851-7428-4456</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Tautan Penting</h3>
            <ul className="space-y-3 text-sm text-gray-400 flex flex-col items-start">
              <li><Link to="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link to="/refund" className="hover:text-white transition-colors">Kebijakan Refund</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
