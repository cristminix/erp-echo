"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [userId, setUserId] = useState("")
  const [attendanceToken, setAttendanceToken] = useState("")
  const [attendanceUrl, setAttendanceUrl] = useState("")
  const [loadingToken, setLoadingToken] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    avatar: "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setUserId(data.id)
        setFormData({
          name: data.name || "",
          email: data.email || "",
          avatar: data.avatar || "",
        })
        if (data.avatar) {
          setAvatarPreview(data.avatar)
        }
        // Intentar obtener el token de asistencia existente
        fetchAttendanceToken(data.id)
      } else {
        setError("Error al cargar datos del usuario")
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setError("Error al cargar datos del usuario")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceToken = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}/attendance-token`)
      if (res.ok) {
        const data = await res.json()
        setAttendanceToken(data.token)
        setAttendanceUrl(data.url)
      }
    } catch (error) {
      // Token no existe aún, no es un error
      console.log("Token de asistencia no generado todavía")
    }
  }

  const generateAttendanceToken = async () => {
    if (!userId) {
      console.error("No userId available")
      setError("Error: Pengguna no identificado")
      return
    }

    console.log("Generating token for userId:", userId)
    setLoadingToken(true)
    setError("")

    try {
      const res = await fetch(`/api/users/${userId}/attendance-token`, {
        method: "POST",
      })

      console.log("Response status:", res.status)

      if (res.ok) {
        const data = await res.json()
        console.log("Token generated successfully:", data)
        setAttendanceToken(data.token)
        setAttendanceUrl(data.url)
        setSuccess("URL de asistencia generada correctamente")
      } else {
        const data = await res.json()
        console.error("Error response:", data)
        setError(data.error || "Error al generar URL de asistencia")
      }
    } catch (error) {
      console.error("Error generating token:", error)
      setError("Error al generar URL de asistencia")
    } finally {
      setLoadingToken(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess("URL copiada al portapapeles")
    setTimeout(() => setSuccess(""), 2000)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setSuccess("Perfil actualizado correctamente")
      } else {
        const data = await res.json()
        setError(data.error || "Error al actualizar perfil")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Error al actualizar perfil")
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setSaving(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setSaving(false)
      return
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (res.ok) {
        setSuccess("Contraseña actualizada correctamente")
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        const data = await res.json()
        setError(data.error || "Error al actualizar contraseña")
      }
    } catch (error) {
      console.error("Error updating password:", error)
      setError("Error al actualizar contraseña")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") {
      setError("Por favor escribe ELIMINAR para confirmar")
      return
    }

    setDeleting(true)
    setError("")

    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
      })

      if (res.ok) {
        // Cerrar sesión y redirigir
        await fetch("/api/auth/logout", { method: "POST" })
        router.push("/")
      } else {
        const data = await res.json()
        setError(data.error || "Error al eliminar cuenta")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      setError("Error al eliminar cuenta")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Profil Saya</h2>
        <p className="text-gray-600 mt-1">
          Gestiona tu información personal y seguridad
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Información del Perfil */}
      <Card>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Información Personal
        </h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de Perfil
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (!file.type.match("image/(png|jpeg|jpg)")) {
                        setError("Solo se permiten archivos PNG, JPG o JPEG")
                        return
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        setError("El archivo no debe superar 2MB")
                        return
                      }
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        const base64String = reader.result as string
                        setFormData({ ...formData, avatar: base64String })
                        setAvatarPreview(base64String)
                        setError("")
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG o JPEG. Máximo 2MB.
                </p>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, avatar: "" })
                      setAvatarPreview(null)
                    }}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    Eliminar foto
                  </button>
                )}
              </div>
            </div>
          </div>

          <Input
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Tu nombre completo"
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="tu@email.com"
          />

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Acceso Móvil para Asistencia */}
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <svg
            className="w-6 h-6 text-teal-600 shrink-0 mt-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-800">
              Acceso Móvil - Registro de Asistencia
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Obtén una URL única para registrar tus entradas y salidas desde tu
              teléfono móvil
            </p>
          </div>
        </div>

        {!attendanceUrl ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-gray-600 mb-6">
              Genera tu URL personalizada para registrar asistencia desde
              cualquier dispositivo
            </p>
            <Button
              type="button"
              onClick={generateAttendanceToken}
              disabled={loadingToken}
              className="mx-auto"
            >
              {loadingToken ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Generando...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Generar URL de Acceso
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <p className="text-sm font-medium text-teal-800 mb-2">
                Tu URL de Asistencia:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={attendanceUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-teal-200 rounded text-sm text-gray-700 font-mono"
                />
                <button
                  onClick={() => copyToClipboard(attendanceUrl)}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors"
                  title="Copiar URL"
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">¿Cómo usar esta URL?</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Abre la URL en tu navegador móvil</li>
                    <li>
                      Guarda la página en tu pantalla de inicio para acceso
                      rápido
                    </li>
                    <li>Usa los botones para registrar entrada y salida</li>
                    <li>
                      Los registros aparecerán automáticamente en tu menú de
                      asistencia
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={attendanceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-center transition-colors flex items-center justify-center gap-2"
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Abrir URL
              </a>
              <button
                onClick={() => setShowQR(!showQR)}
                className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                {showQR ? "Ocultar" : "Mostrar"} QR
              </button>
              <button
                onClick={generateAttendanceToken}
                disabled={loadingToken}
                className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                title="Regenerar URL (la anterior dejará de funcionar)"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            {showQR && (
              <div className="text-center py-6 bg-white border-2 border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-4">
                  Escanea este código QR con tu móvil
                </p>
                <div className="inline-block p-4 bg-white">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(attendanceUrl)}`}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Cambiar Contraseña */}
      <Card>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Cambiar Contraseña
        </h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Contraseña Actual"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            required
            placeholder="Tu contraseña actual"
          />

          <Input
            label="Nueva Contraseña"
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            required
            placeholder="Mínimo 6 caracteres"
            helperText="La contraseña debe tener al menos 6 caracteres"
          />

          <Input
            label="Confirmar Nueva Contraseña"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            required
            placeholder="Repite la nueva contraseña"
          />

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Zona de Peligro - Eliminar Cuenta */}
      <Card className="border-red-200 bg-red-50">
        <div className="flex items-start gap-3 mb-4">
          <svg
            className="w-6 h-6 text-red-600 flex-shrink-0 mt-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="text-xl font-semibold text-red-800">
              Zona de Peligro
            </h3>
            <p className="text-sm text-red-700 mt-1">
              La eliminación de tu cuenta es permanente e irreversible
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <Button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Eliminar mi cuenta
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-red-300">
              <p className="text-sm text-gray-700 mb-3">
                Esta acción eliminará permanentemente:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                <li>✗ Tu cuenta de usuario</li>
                <li>✗ Todas tus empresas</li>
                <li>✗ Todos los contactos, productos y facturas</li>
                <li>✗ Todos los datos asociados</li>
              </ul>
              <p className="text-sm font-semibold text-red-600">
                Esta acción NO se puede deshacer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-red-800 mb-2">
                Escribe <span className="font-bold">ELIMINAR</span> para
                confirmar
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-black"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText("")
                }}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "ELIMINAR"}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Eliminar Permanentemente
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
