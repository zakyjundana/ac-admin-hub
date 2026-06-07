import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wrench,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Mock auth — langsung ke dashboard
    setTimeout(() => {
      setLoading(false);
      window.location.href = "/";
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-blue-900/40 to-cyan-900/20 border-r border-white/5 p-12">
        <Link to="/landing" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl">CoolService</span>
        </Link>

        <div>
          {/* Quote card */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
            <p className="text-gray-300 text-sm leading-relaxed italic mb-5">
              "Dulu saya catat semua di buku tulis dan sering lupa. Sekarang
              semua orderan, jadwal, dan stok langsung kelihatan dari HP."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-sm font-bold">
                B
              </div>
              <div>
                <div className="text-sm font-semibold">Pak Budi</div>
                <div className="text-xs text-gray-500">
                  Servis AC Mandiri, Bekasi
                </div>
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-green-300">
                Data Anda Aman
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Semua data dienkripsi dan disimpan dengan aman. Kami tidak
                pernah menjual data Anda ke pihak lain.
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600">
          © 2026 CoolService. Dibuat untuk tukang AC Indonesia.
        </p>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link
            to="/landing"
            className="flex lg:hidden items-center gap-2 mb-8 justify-center"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">CoolService</span>
          </Link>

          <h1 className="text-2xl font-bold mb-1">Selamat Datang Kembali</h1>
          <p className="text-gray-400 text-sm mb-8">
            Belum punya akun?{" "}
            <Link
              to="/register"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Daftar gratis di sini
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="budi@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Lupa password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password Anda"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] mt-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk ke Dashboard
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-gray-600">
              Belum kenal CoolService?{" "}
              <Link
                to="/landing"
                className="text-blue-500 hover:underline"
              >
                Lihat fitur lengkapnya
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
