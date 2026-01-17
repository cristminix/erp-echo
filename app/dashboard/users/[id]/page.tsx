"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"

interface Company {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  defaultCompanyId: string | null
  createdById: string | null
}

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [attendanceToken, setAttendanceToken] = useState("")
  const [attendanceUrl, setAttendanceUrl] = useState("")
  const [loadingToken, setLoadingToken] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    active: true,
    defaultCompanyId: "",
    avatar: "",
    hourlyRate: "",
  })

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      const [userRes, companiesRes] = await Promise.all([
        fetch(`/api/users/${userId}`, { credentials: "include" }),
        fetch("/api/companies", { credentials: "include" }),
      ])

      if (userRes.ok && companiesRes.ok) {
        const userData = await userRes.json()
        const companiesData = await companiesRes.json()

        setUser(userData)
        setCompanies(companiesData)
        setFormData({
          name: userData.name,
          email: userData.email,
          password: "",
          role: userData.role,
          active: userData.active,
          defaultCompanyId: userData.defaultCompanyId || "",
          avatar: userData.avatar || "",
          hourlyRate: userData.hourlyRate || "",
        })
        if (userData.avatar) {
          setAvatarPreview(userData.avatar)
        }
        // Intentar obtener el token de asistencia
        fetchAttendanceToken(userId)
      } else {
        setError("Error al cargar el usuario")
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Error al cargar el usuario")
    } finally {
      setLoading(false)
    }
  }

  const fetchAttendanceToken = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}/attendance-token`, {
        credentials: "include",
      })
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
      setError("Error: Pengguna no identificado")
      return
    }

    setLoadingToken(true)
    setError("")

    try {
      const res = await fetch(`/api/users/${userId}/attendance-token`, {
        method: "POST",
        credentials: "include",
      })

      if (res.ok) {
        const data = await res.json()
        setAttendanceToken(data.token)
        setAttendanceUrl(data.url)
        setSuccess("URL de asistencia generada correctamente")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        const data = await res.json()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active,
        defaultCompanyId: formData.defaultCompanyId || undefined,
        avatar: formData.avatar || undefined,
        hourlyRate: formData.hourlyRate
          ? parseFloat(formData.hourlyRate)
          : undefined,
      }

      // Solo incluir password si se proporcionó uno nuevo
      if (formData.password) {
        updateData.password = formData.password
      }

      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (res.ok) {
        router.push("/dashboard/users")
      } else {
        const data = await res.json()
        setError(data.error || "Error al actualizar usuario")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      setError("Error al actualizar usuario")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600">Pengguna no encontrado</p>
            <Button
              onClick={() => router.push("/dashboard/users")}
              className="mt-4"
            >
              Volver a usuarios
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const isPrincipalUser = !user.createdById

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      return
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.push("/dashboard/users")
      } else {
        const data = await res.json()
        alert(data.error || "Error al eliminar usuario")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error al eliminar usuario")
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Editar Pengguna
            </h2>
            <p className="text-gray-600 mt-1">
              Actualiza la información del usuario
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/users/new">
              <Button variant="outline">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Crear Nuevo
              </Button>
            </Link>
            {!isPrincipalUser && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                Eliminar
              </Button>
            )}
          </div>
        </div>
        {isPrincipalUser && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg text-sm">
            <span className="font-medium">Pengguna Principal:</span> No puedes
            editar tu propio usuario desde aquí
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
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
                    disabled={isPrincipalUser}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={isPrincipalUser}
                      className="mt-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Eliminar foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <Input
              label="Nombre Completo"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isPrincipalUser}
              placeholder="Ej: Juan Pérez"
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isPrincipalUser}
              placeholder="usuario@ejemplo.com"
            />

            <Input
              label="Nueva Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isPrincipalUser}
              placeholder="Dejar en blanco para mantener la actual"
              helperText="Solo completa este campo si deseas cambiar la contraseña"
            />

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isPrincipalUser}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="user">Pengguna</option>
                <option value="admin">Administrador</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Los administradores tienen acceso completo al sistema
              </p>
            </div>

            <div>
              <label
                htmlFor="defaultCompanyId"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Perusahaan Asignada
              </label>
              <select
                id="defaultCompanyId"
                name="defaultCompanyId"
                value={formData.defaultCompanyId}
                onChange={handleChange}
                disabled={isPrincipalUser}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Sin empresa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Solo puedes asignar empresas que tú has creado
              </p>
            </div>

            <Input
              label="Coste por Hora (€)"
              name="hourlyRate"
              type="number"
              step="0.01"
              min="0"
              value={formData.hourlyRate}
              onChange={handleChange}
              disabled={isPrincipalUser}
              placeholder="Ej: 15.50"
              helperText="Coste por hora del empleado para calcular el importe de asistencia"
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleChange}
                disabled={isPrincipalUser}
                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <label
                htmlFor="active"
                className="ml-2 block text-sm text-gray-700"
              >
                Pengguna activo
              </label>
            </div>
            <p className="text-sm text-gray-500 -mt-2 ml-6">
              Los usuarios inactivos no pueden iniciar sesión
            </p>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || isPrincipalUser}
              className="flex-1"
            >
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

      {/* Sección de Acceso Móvil para Asistencia */}
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
              Genera una URL única para que este usuario registre sus entradas y
              salidas desde su teléfono móvil
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {!attendanceUrl ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-gray-600 mb-6">
              Genera una URL personalizada para que{" "}
              {formData.name || "el usuario"} registre su asistencia desde
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
                URL de Asistencia:
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
                    <li>
                      Comparte la URL con el usuario por WhatsApp, email, etc.
                    </li>
                    <li>
                      El usuario puede guardar la página en su pantalla de
                      inicio
                    </li>
                    <li>
                      Podrá registrar entrada y salida sin necesidad de iniciar
                      sesión
                    </li>
                    <li>
                      Los registros aparecerán automáticamente en el menú de
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
                  Escanea este código QR con el móvil
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
    </div>
  )
}
