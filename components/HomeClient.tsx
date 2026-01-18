"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function HomeClient() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setIsAuthenticated(true)
        setUserName(data.name || data.email || "Pengguna")
      }
    } catch (error) {
      console.error("Error checking auth:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setIsAuthenticated(false)
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">Echo ERP</span>
            </Link>
            {!loading && (
              <div className="flex items-center space-x-4">
                <Link href="/blog">
                  <button className="px-4 py-2 text-gray-700 hover:text-teal-600 font-medium">
                    Blog
                  </button>
                </Link>
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <button className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium">
                        {userName}
                      </button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg shadow-md transition-all"
                    >
                      Keluar
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <button className="px-4 py-2 text-teal-600 hover:text-teal-700 font-medium">
                        Masuk
                      </button>
                    </Link>
                    {process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === "true" && (
                      <Link href="/register">
                        <button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-md transition-all">
                          Daftar
                        </button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Kelola Bisnis Anda Secara Komprehensif
            <span className="block text-teal-600 mt-2">
              dengan ERP yang Sederhana dan Kuat
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Sistem manajemen bisnis lengkap: produk, pelanggan, faktur dan
            kontrol inventaris. Semua yang Anda butuhkan untuk bisnis Anda di
            satu tempat.
          </p>

          {/* GitHub Badge */}
          <div className="flex justify-center mb-8 hidden">
            <a
              href="https://github.com/falconsoft3d/falconerp.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Ver Código en GitHub</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
          {!loading && (
            <div className="flex justify-center space-x-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <button className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                    Ke Dasbor
                  </button>
                </Link>
              ) : (
                <>
                  {process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === "true" && (
                    <Link href="/register">
                      <button className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                        Mulai Gratis
                      </button>
                    </Link>
                  )}
                  <Link href="/login">
                    <button className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200">
                      Lihat Demo
                    </button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* About Project Section */}
        <div className="hidden mt-24 bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-12 text-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">
              Tentang Proyek
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              <strong className="text-white">Echo ERP</strong> adalah sistem ERP
              lengkap yang dikembangkan dengan teknologi web terbaru. Proyek ini
              bersifat <strong className="text-teal-400">open source</strong>{" "}
              dan dirancang untuk membantu usaha kecil dan menengah mengelola
              operasi mereka secara efisien dan profesional.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold mb-3 text-teal-400">
                  🚀 Tecnologías Utilizadas
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>
                    • <strong>Next.js 14</strong> - Framework React
                  </li>
                  <li>
                    • <strong>TypeScript</strong> - Pengetikan statis
                  </li>
                  <li>
                    • <strong>Prisma</strong> - ORM untuk basis data
                  </li>
                  <li>
                    • <strong>PostgreSQL</strong> - Basis data
                  </li>
                  <li>
                    • <strong>Tailwind CSS</strong> - Desain modern
                  </li>
                  <li>
                    • <strong>JWT</strong> - Otentikasi aman
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3 text-teal-400">
                  ✨ Fitur Utama
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• Multi-perusahaan dengan tema khusus</li>
                  <li>• Manajemen lengkap produk dan inventaris</li>
                  <li>• Fakturasi dengan perhitungan otomatis PPN</li>
                  <li>• CRM dengan pipeline peluang</li>
                  <li>• Point of Sale (POS) terintegrasi</li>
                  <li>• Sistem proyek dan tugas</li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
              <h3 className="text-xl font-semibold mb-3 text-teal-400">
                📖 Sumber Terbuka
              </h3>
              <p className="text-gray-300 mb-4">
                Proyek ini tersedia di GitHub sehingga Anda dapat
                mempelajarinya, memodifikasinya atau menggunakannya dalam proyek
                Anda sendiri. Kontribusi sangat diharapkan!
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://github.com/falconsoft3d/falconerp.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Lihat Repositori
                </a>
                <a
                  href="https://github.com/falconsoft3d/falconerp.xyz/fork"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Fork di GitHub
                </a>
                <a
                  href="https://github.com/falconsoft3d/falconerp.xyz/archive/refs/heads/main.zip"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Unduh ZIP
                </a>
              </div>
            </div>

            <div className="text-center text-gray-400 text-sm">
              <p>Desarrollado con ❤️ por la comunidad • Licencia MIT</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Manajemen Produk
            </h3>
            <p className="text-gray-600">
              Kelola katalog produk Anda dengan harga, stok dan kategori.
              Kendali penuh atas inventaris Anda.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Basis Pelanggan
            </h3>
            <p className="text-gray-600">
              Atur informasi pelanggan Anda dengan data kontak lengkap dan
              pelacakan faktur.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Fakturasi Cepat
            </h3>
            <p className="text-gray-600">
              Buat faktur profesional dalam hitungan detik dengan perhitungan
              otomatis PPN dan total. Sempurna untuk bisnis Anda.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Semua yang Anda Butuhkan untuk Bisnis Anda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">📦</div>
              <p className="text-gray-600 font-semibold">Produk</p>
              <p className="text-sm text-gray-500">Manajemen lengkap</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">👥</div>
              <p className="text-gray-600 font-semibold">Pelanggan</p>
              <p className="text-sm text-gray-500">Basis data</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">📄</div>
              <p className="text-gray-600 font-semibold">Faktur</p>
              <p className="text-sm text-gray-500">Profesional</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600 mb-2">📊</div>
              <p className="text-gray-600 font-semibold">Laporan</p>
              <p className="text-sm text-gray-500">Real-time</p>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="mt-24 bg-gray-50 rounded-2xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ada pertanyaan?
            </h2>
            <p className="text-xl text-gray-600">
              Hubungi kami dan kami akan merespons secepat mungkin
            </p>
          </div>

          <ContactForm />
        </div>

        {/* CTA Section */}
        {!loading &&
          !isAuthenticated &&
          process.env.NEXT_PUBLIC_ALLOW_REGISTRATION === "true" && (
            <div className="mt-24 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Siap Menyederhanakan Manajemen Bisnis Anda?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Mulai hari ini dan dapatkan kendali penuh atas perusahaan Anda
              </p>
              <Link href="/register">
                <button className="px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Buat Akun Gratis
                </button>
              </Link>
            </div>
          )}
      </div>
    </>
  )
}

function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Preparar datos con valores null en lugar de strings vacíos
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company: formData.company || null,
        message: formData.message,
      }

      const res = await fetch("/api/web-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      })

      if (res.ok) {
        setSuccess(true)
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          message: "",
        })
        setTimeout(() => setSuccess(false), 5000)
      } else {
        const data = await res.json()
        console.error("Error del servidor:", data)

        // Formatear errores de validación de forma amigable
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details
            .map((err: { message: string }) => err.message)
            .join(", ")
          setError(errorMessages)
        } else {
          setError(data.error || "Error al enviar el mensaje")
        }
      }
    } catch (err) {
      console.error("Error al enviar:", err)
      setError("Error al enviar el mensaje")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center max-w-2xl mx-auto">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-800 mb-2">
          Pesan terkirim!
        </h3>
        <p className="text-green-700">
          Terima kasih telah menghubungi kami. Kami telah mengirimkan email
          konfirmasi dan akan segera merespons Anda.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-xl p-8 space-y-6 max-w-2xl mx-auto"
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
            placeholder="Nama Anda"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
            placeholder="email@anda.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telepon
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
            placeholder="+62 123 456 789"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perusahaan
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
            placeholder="Perusahaan Anda"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pesan *{" "}
          <span className="text-gray-500 text-xs">(minimal 10 karakter)</span>
        </label>
        <textarea
          required
          minLength={10}
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          rows={5}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900"
          placeholder="Beritahu kami bagaimana kami bisa membantu... (minimal 10 karakter)"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.message.length}/10 karakter
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 rounded-lg shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Mengirim..." : "Kirim Pesan"}
      </button>
    </form>
  )
}
