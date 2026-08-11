
# Stabilkan Login CoolService Tanpa Ganti Backend

## Rekomendasi

Tetap gunakan **Lovable Cloud**. Pemeriksaan saat ini menunjukkan backend, database, dan layanan autentikasi sehat. Log autentikasi juga mencatat login Google berhasil, sehingga pindah ke Firebase, Clerk, atau backend lain justru menambah migrasi data, perubahan RLS, dan risiko baru tanpa menyelesaikan akar masalah di aplikasi.

Masalah yang perlu dibereskan adalah jalur autentikasi di frontend: konfigurasi environment dibuat ulang di beberapa tempat, masih ada fallback mode demo, guard dan redirect saling tumpang tindih, serta login dan register memakai callback yang berbeda.

## Perubahan

1. **Sederhanakan konfigurasi backend**
   - Hapus deteksi URL/key manual dan injeksi environment khusus dari konfigurasi Vite.
   - Gunakan satu client Lovable Cloud yang sudah dihasilkan sebagai sumber tunggal untuk auth dan data.
   - Pertahankan file integrasi generated tanpa modifikasi manual.

2. **Bersihkan sisa mode demo**
   - Hapus user demo, profil demo, local storage demo, dan cabang fallback saat konfigurasi tidak tersedia.
   - Jika konfigurasi benar-benar gagal, tampilkan status error yang jelas tanpa membuat user palsu atau memicu redirect berulang.

3. **Satukan alur login**
   - Email/password dan Google memakai satu mekanisme penyimpanan sesi.
   - Google kembali ke route publik yang konsisten, menunggu sesi benar-benar tersedia, lalu menuju target internal yang sudah divalidasi.
   - Register Google diarahkan ke onboarding hanya untuk user yang belum selesai onboarding; user lama langsung ke dashboard.

4. **Rapikan auth guard**
   - Gunakan satu guard client-only pada layout halaman terproteksi.
   - Verifikasi user melalui auth service, bukan cookie penanda buatan aplikasi.
   - Hilangkan pengecekan ganda dan redirect yang bisa memantulkan user antara login, onboarding, dan dashboard.

5. **Rapikan listener sesi**
   - Jadikan listener auth global sebagai sumber pembaruan sesi.
   - Batasi invalidasi/redirect hanya pada event masuk, keluar, dan pembaruan user agar refresh token tidak memicu reload halaman.
   - Ganti tipe longgar pada hook auth dengan tipe user yang aman.

6. **Verifikasi end-to-end**
   - Uji daftar email, login email, login Google, refresh dashboard, logout, dan redirect `next`.
   - Pastikan tidak ada loop `/login`, toast missing environment, atau error browser/server.
   - Jalankan pengecekan TypeScript/build dan uji desktop serta mobile tanpa mengubah fitur operasional lain.

## Batasan

- Tidak mengganti database atau memigrasikan data.
- Tidak mengubah halaman operasional, iPaymu, MCP, atau Google Calendar kecuali bagian yang langsung bergantung pada sesi login.
- Tidak menyimpan atau menampilkan secret di kode.
