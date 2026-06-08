import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, ChevronLeft, CreditCard } from "lucide-react";

export const Route = createFileRoute("/refund")({
  head: () => ({ meta: [{ title: "Kebijakan Pengembalian Dana — CoolService" }] }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-12 px-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Navigation back */}
        <Link 
          to="/landing" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Kebijakan Pengembalian Dana</h1>
            <p className="text-sm text-gray-400 mt-1">Terakhir diperbarui: 8 Juni 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <p>
            Di **CoolService**, kami berkomitmen untuk memberikan kualitas layanan SaaS terbaik bagi pengelolaan operasional servis AC Anda. Kebijakan Pengembalian Dana (Refund Policy) ini mengatur mekanisme pengembalian biaya langganan yang diproses melalui payment gateway **iPaymu**.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Ketentuan Pembatalan Langganan</h2>
            <p>
              Anda dapat membatalkan paket langganan Starter atau Pro Anda kapan saja langsung melalui menu profil bisnis di dashboard admin Anda. Setelah pembatalan, akses ke fitur premium akan tetap aktif hingga akhir masa periode penagihan bulan berjalan. Tidak ada biaya pembatalan tambahan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Kriteria Pengembalian Dana (Refund)</h2>
            <p>
              Kami memberikan pengembalian dana penuh atau sebagian dalam kondisi berikut:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>
                **Kesalahan Sistem / Overcharge**: Terjadi kesalahan sistem ganda pada penagihan sehingga saldo Anda terpotong lebih dari satu kali untuk periode tagihan yang sama.
              </li>
              <li>
                **Gagal Aktivasi**: Anda sudah melakukan pembayaran sukses melalui iPaymu, namun sistem CoolService gagal mengaktifkan status akun premium Anda dalam waktu 24 jam setelah konfirmasi pembayaran dan tim support kami tidak berhasil menyelesaikannya.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Pengecualian Refund</h2>
            <p>
              Pengembalian dana **tidak berlaku** pada kondisi di bawah ini:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Anda lupa melakukan pembatalan otomatis sebelum tanggal jatuh tempo tagihan berikutnya dimulai.</li>
              <li>Akun Anda ditangguhkan atau dibekukan secara permanen karena melanggar *Syarat & Ketentuan* CoolService (seperti penyalahgunaan spam WhatsApp).</li>
              <li>Kelalaian input data atau ketidakcocokan perangkat pengguna yang tidak dikonsultasikan terlebih dahulu dengan tim teknis kami.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Alur Pengajuan Pengembalian Dana</h2>
            <p>
              Untuk mengajukan klaim pengembalian dana, harap ikuti langkah berikut:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 mt-2">
              <li>Kirimkan email ke **billing@coolservice.com** atau hubungi support WhatsApp kami dengan menyertakan email terdaftar, ID User, bukti transfer/status transaksi dari iPaymu, serta alasan pengajuan refund.</li>
              <li>Tim keuangan kami akan melakukan audit internal terhadap riwayat pembayaran Anda dalam kurun waktu **3 hari kerja**.</li>
              <li>Jika klaim disetujui, dana akan dikembalikan ke rekening bank atau dompet digital asal Anda dalam waktu **5-7 hari kerja** (sesuai kebijakan transfer antar bank iPaymu).</li>
            </ol>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
              <Wrench className="w-3 h-3 text-blue-400" />
            </div>
            <span>© 2026 CoolService</span>
          </div>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
