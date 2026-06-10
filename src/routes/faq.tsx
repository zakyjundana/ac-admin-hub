import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench, ChevronLeft, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — CoolService" }] }),
  component: FAQPage,
});

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Apa itu CoolService dan bagaimana cara kerjanya?",
      answer: (
        <p>
          CoolService adalah platform Software-as-a-Service (SaaS) manajemen operasional yang dirancang khusus untuk pemilik usaha servis AC di Indonesia. Sistem kami membantu mengotomatiskan penjadwalan teknisi, pemantauan stok spare part, pencatatan keuangan, hingga pengiriman notifikasi/link booking mandiri ke klien melalui WhatsApp.
        </p>
      ),
    },
    {
      question: "Apakah CoolService sudah terintegrasi dengan iPaymu?",
      answer: (
        <p>
          Ya, CoolService terintegrasi penuh dengan payment gateway <strong>iPaymu</strong>. Integrasi ini memungkinkan pemilik usaha melakukan upgrade langganan ke paket Starter atau Pro secara instan dan aman menggunakan metode pembayaran Virtual Account, QRIS, E-Wallet, maupun ritel seperti Alfamart/Indomaret.
        </p>
      ),
    },
    {
      question: "Bagaimana cara melakukan pengujian transaksi (Test Transaction)?",
      answer: (
        <div>
          <p className="mb-2">
            Kami mendukung pengujian transaksi baik di lingkungan sandbox maupun production:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Mode Sandbox/Uji Coba:</strong> Menggunakan API Key sandbox untuk menyimulasikan transaksi tanpa menggunakan uang riil.</li>
            <li><strong>Mode Production:</strong> Uji coba transaksi riil dapat dilakukan dengan memilih paket Starter atau Pro menggunakan Virtual Account atau QRIS langsung di lingkungan production iPaymu.</li>
          </ul>
        </div>
      ),
    },
    {
      question: "Bagaimana dengan kebijakan pengembalian dana (Refund Policy)?",
      answer: (
        <p>
          Kami berkomitmen menjaga kepuasan Anda. Pengembalian dana penuh berlaku jika sistem kami gagal mengaktifkan fitur premium dalam waktu 24 jam setelah pembayaran berhasil dikonfirmasi oleh iPaymu, atau terjadi kesalahan potong ganda (overcharge) akibat gangguan jaringan. Pengajuan refund dapat dilakukan dengan mengirimkan bukti bayar ke <strong>billing@coolservice.com</strong>.
        </p>
      ),
    },
    {
      question: "Di mana saya bisa mengisi alamat IP Outbound Website di iPaymu?",
      answer: (
        <p>
          Alamat IP Outbound (IP keluar server backend Anda) dapat dikonfigurasi di dashboard merchant iPaymu pada menu Pengaturan Integrasi. IP ini dibutuhkan agar server iPaymu dapat memvalidasi callback/webhook notifikasi pembayaran dari server CoolService secara aman.
        </p>
      ),
    },
    {
      question: "Apakah saya bisa membatalkan langganan kapan saja?",
      answer: (
        <p>
          Tentu saja. Tidak ada kontrak mengikat. Anda dapat membatalkan perpanjangan otomatis paket Starter atau Pro kapan saja melalui menu Profil Bisnis. Setelah dibatalkan, akun premium Anda akan tetap aktif hingga akhir masa penagihan bulan berjalan dan tidak akan ditagih kembali pada bulan berikutnya.
        </p>
      ),
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-12 px-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Navigation back */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">FAQ (Tanya Jawab)</h1>
            <p className="text-sm text-gray-400 mt-1">Pertanyaan umum seputar layanan dan pembayaran CoolService</p>
          </div>
        </div>

        {/* Content - FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-white/20"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold text-white focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-400" : ""}`} />
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-60 border-t border-white/5 opacity-100 p-5" : "max-h-0 opacity-0 pointer-events-none overflow-hidden"
                  }`}
                >
                  <div className="text-sm text-gray-300 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
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
            <Link to="/refund" className="hover:text-white transition-colors">Kebijakan Refund</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
