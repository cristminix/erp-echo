# 🚀 Echo ERP - Sistem ERP Lengkap

Sistem ERP modern dan lengkap dikembangkan dengan Next.js 14, dirancang untuk usaha kecil dan menengah yang perlu mengelola operasi secara efisien dan profesional.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

## 📋 Fitur Utama

### 🏢 Multi-Perusahaan

- ✅ Manajemen banyak perusahaan dari satu akun
- ✅ Tema kustom per perusahaan (warna primer dan sekunder)
- ✅ Konfigurasi independen penomoran faktur
- ✅ Logo dan data fiskal yang disesuaikan

### 📦 Manajemen Produk

- ✅ Katalog lengkap dengan gambar
- ✅ Kontrol stok dan inventaris
- ✅ Kategori dan harga dengan PPN
- ✅ Impor dari Odoo

### 👥 Manajemen Kontak

- ✅ Basis data pelanggan dan pemasok
- ✅ Informasi lengkap (NIF, alamat, kontak)
- ✅ Riwayat faktur
- ✅ Impor dari Odoo

### 📄 Faktur Lengkap

- ✅ Faktur penjualan dan pembelian
- ✅ Perhitungan otomatis PPN dan total
- ✅ Pembuatan PDF profesional
- ✅ Pengiriman melalui email
- ✅ Lampiran dan komentar
- ✅ Status pembayaran
- ✅ Impor massal dari Excel

### 💰 Point of Sale (POS)

- ✅ Antarmuka intuitif dengan gambar produk
- ✅ Penyaringan berdasarkan kategori
- ✅ Pencarian cepat
- ✅ Pembuatan faktur instan
- ✅ Diskon dan perhitungan otomatis

### 🎯 CRM

- ✅ Manajemen peluang penjualan
- ✅ Pipeline yang dapat disesuaikan dengan drag & drop
- ✅ Tahapan yang dapat dikonfigurasi
- ✅ Formulir publik untuk penangkapan lead

### 📊 Proyek dan Tugas

- ✅ Manajemen proyek
- ✅ Kontrol tugas per proyek
- ✅ Status dan prioritas
- ✅ Penugasan ke pengguna

### 👤 Kontrol Kehadiran

- ✅ Pencatatan masuk/keluar
- ✅ Perhitungan jam kerja
- ✅ Riwayat per karyawan

### 🔐 Autentikasi dan Keamanan

- ✅ Sistem login/registrasi
- ✅ JWT untuk autentikasi
- ✅ Verifikasi email
- ✅ Pemulihan kata sandi
- ✅ Peran pengguna

### 🌐 API REST

- ✅ API Key per perusahaan
- ✅ Token unggah berkas
- ✅ Endpoint yang didokumentasikan

### 📧 Sistem Email

- ✅ Konfigurasi SMTP yang disesuaikan
- ✅ Template email
- ✅ Pengiriman faktur otomatis

### 🔄 Integrasi dengan Odoo

- ✅ Impor produk
- ✅ Impor kontak
- ✅ Sinkronisasi data

## 🛠 Teknologi yang Digunakan

- **Framework**: Next.js 14 (App Router)
- **Bahasa**: TypeScript 5
- **Basis Data**: PostgreSQL
- **ORM**: Prisma 6
- **Gaya**: Tailwind CSS 4
- **Autentikasi**: JWT (jose)
- **Pembuatan PDF**: jsPDF + Puppeteer
- **Drag & Drop**: @hello-pangea/dnd
- **Grafik**: Recharts
- **Excel**: XLSX
- **Email**: Nodemailer

## 🚀 Instalasi

### Prasyarat

- Node.js 18+
- PostgreSQL 14+
- npm atau yarn

### Langkah Instalasi

1. **Kloning repositori**

2. **Instal dependensi**

```bash
npm install
```

3. **Konfigurasi variabel lingkungan**

Buat file `.env` di root proyek:

```env
# Basis data PostgreSQL
DATABASE_URL="postgresql://pengguna:katasandi@localhost:5432/falconerp"

# JWT Secret (buat kunci yang aman)
JWT_SECRET="kunci-rahasia-anda-yang-sangat-aman-disini"

# Konfigurasi aplikasi
NEXT_PUBLIC_ALLOW_REGISTRATION="true"

# Email (opsional - untuk pengiriman faktur)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="email-anda@gmail.com"
SMTP_PASSWORD="kata-sandi-aplikasi"
```

4. **Konfigurasi basis data**

```bash
# Menghasilkan klien Prisma
npx prisma generate

# Menjalankan migrasi
npx prisma db push

# (Opsional) Memuat data contoh
npx prisma db seed
```

5. **Jalankan dalam mode pengembangan**

```bash
npm run dev
```

Aplikasi akan tersedia di `http://localhost:3000`

## 📦 Penyebaran ke Produksi

### Vercel (Direkomendasikan)

1. **Hubungkan dengan GitHub**
   - Impor proyek dari GitHub ke Vercel
   - Konfigurasikan variabel lingkungan

2. **Variabel lingkungan di Vercel**

   ```
   DATABASE_URL
   JWT_SECRET
   NEXT_PUBLIC_ALLOW_REGISTRATION
   ```

3. **Deploy otomatis**
   - Vercel akan melakukan deploy otomatis pada setiap push

### Build Manual

```bash
# Membangun untuk produksi
npm run build

# Menjalankan di produksi
npm start
```

## 📚 Struktur Proyek

```
falconerp.xyz/
├── app/                    # Halaman dan rute Next.js
│   ├── api/               # API Routes
│   ├── dashboard/         # Panel administrasi
│   ├── login/            # Autentikasi
│   └── ...
├── components/            # Komponen React yang dapat digunakan kembali
├── lib/                   # Utilitas dan helper
├── prisma/               # Skema dan migrasi basis data
├── public/               # Berkas statis
└── content/              # Konten blog (Markdown)
```
