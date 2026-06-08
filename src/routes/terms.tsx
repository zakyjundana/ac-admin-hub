import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, ChevronLeft, Scale } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Syarat & Ketentuan — CoolService" }] }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-12 px-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
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
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Syarat & Ketentuan</h1>
            <p className="text-sm text-gray-400 mt-1">Terakhir diperbarui: 8 Juni 2026</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <p>
            Selamat datang di **CoolService**. Harap baca Syarat dan Ketentuan ini secara seksama sebelum Anda mulai menggunakan layanan dashboard dan aplikasi kami. Dengan mengakses dan menggunakan layanan CoolService, Anda menyatakan bahwa Anda menyetujui seluruh ketentuan di bawah ini.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Definisi Layanan</h2>
            <p>
              CoolService adalah platform Software-as-a-Service (SaaS) yang menyediakan solusi administrasi operasional untuk pemilik usaha servis AC, termasuk manajemen teknisi, penjadwalan, pengelolaan stok spare part, pencatatan keuangan dasar, dan pengiriman notifikasi WhatsApp ke pelanggan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Akun dan Registrasi</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Anda wajib memberikan informasi bisnis yang akurat, lengkap, dan terbaru selama proses pendaftaran.</li>
              <li>Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi akun Anda dan seluruh aktivitas yang terjadi di bawah akun tersebut.</li>
              <li>Setiap akun hanya boleh digunakan oleh satu entitas usaha legal yang terdaftar.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Paket Langganan dan Ketentuan Pembayaran</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>CoolService menyediakan paket Free (Gratis), Starter, dan Pro dengan fitur dan batasan teknisi yang berbeda sesuai deskripsi di halaman paket kami.</li>
              <li>Upgrade akun ke paket berbayar diproses secara instan melalui payment gateway **iPaymu**.</li>
              <li>Seluruh biaya langganan sudah termasuk pajak yang berlaku dan ditagih setiap bulan (sistem bulanan otomatis/prabayar).</li>
              <li>Keterlambatan pembayaran tagihan perpanjangan dapat menyebabkan penangguhan sementara akses fitur premium hingga pembayaran diselesaikan.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Kebijakan Penggunaan yang Adil (Fair Use Policy)</h2>
            <p>
              Anda setuju untuk tidak menggunakan CoolService untuk aktivitas ilegal, menyebarkan spam melalui integrasi WhatsApp, mengirim pesan penipuan ke klien Anda, atau mengunggah data yang merusak sistem keamanan CoolService. Pelanggaran terhadap kebijakan ini akan mengakibatkan pemblokiran akun secara permanen tanpa pengembalian dana.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Perubahan Ketentuan</h2>
            <p>
              CoolService berhak untuk memperbarui atau mengubah Syarat dan Ketentuan ini kapan saja. Perubahan akan diumumkan melalui dashboard admin atau email Anda. Penggunaan berkelanjutan setelah perubahan tersebut menandakan persetujuan Anda terhadap syarat yang baru.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Hukum yang Mengatur</h2>
            <p>
              Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap perselisihan yang timbul dari layanan ini akan diselesaikan secara musyawarah mufakat, atau melalui yurisdiksi Pengadilan Negeri di Indonesia jika tidak tercapai mufakat.
            </p>
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
            <Link to="/refund" className="hover:text-white transition-colors">Kebijakan Refund</Link>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
