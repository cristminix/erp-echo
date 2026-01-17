"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { DataTable } from "@/components/DataTable"

interface User {
  id: string
  name: string
  email: string
  hourlyRate?: number | null
}

interface Attendance {
  id: string
  userId: string
  user: User
  date: string
  checkIn: string
  checkOut: string | null
  notes: string | null
  hourlyRate: number | null
  projectId: string | null
  taskId: string | null
  project?: {
    id: string
    name: string
  } | null
  task?: {
    id: string
    title: string
  } | null
}

export default function AttendancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeCompany, setActiveCompany] = useState<any>(null)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedDate, setSelectedDate] = useState("")
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showCheckOutModal, setShowCheckOutModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState("")
  const [checkInTime, setCheckInTime] = useState("")
  const [checkOutTime, setCheckOutTime] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedTask, setSelectedTask] = useState("")

  useEffect(() => {
    fetchActiveCompany()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (activeCompany) {
      fetchProjects()
    }
  }, [activeCompany])

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject)
    } else {
      setTasks([])
      setSelectedTask("")
    }
  }, [selectedProject])

  useEffect(() => {
    if (activeCompany) {
      fetchAttendances()
    }
  }, [activeCompany, selectedDate])

  const fetchActiveCompany = async () => {
    try {
      const res = await fetch("/api/companies?active=true", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          setActiveCompany(data[0])
        }
      }
    } catch (error) {
      console.error("Error fetching active company:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchProjects = async () => {
    if (!activeCompany) return
    try {
      const res = await fetch(`/api/projects?companyId=${activeCompany.id}`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  const fetchTasks = async (projectId: string) => {
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setTasks([])
    }
  }

  const fetchAttendances = async () => {
    if (!activeCompany) return

    try {
      setLoading(true)
      const url = selectedDate
        ? `/api/attendance?companyId=${activeCompany.id}&date=${selectedDate}`
        : `/api/attendance?companyId=${activeCompany.id}`

      const res = await fetch(url, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setAttendances(data)
      }
    } catch (error) {
      console.error("Error fetching attendances:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!selectedUser || !activeCompany) return

    try {
      const today = selectedDate
      const dateObj = new Date(today)
      dateObj.setHours(0, 0, 0, 0)

      const checkInDateTime = checkInTime
        ? new Date(`${today}T${checkInTime}:00`)
        : new Date()

      const checkOutDateTime = checkOutTime
        ? new Date(`${today}T${checkOutTime}:00`)
        : null

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedUser,
          companyId: activeCompany.id,
          date: dateObj.toISOString(),
          checkIn: checkInDateTime.toISOString(),
          checkOut: checkOutDateTime?.toISOString() || null,
          notes: notes || null,
          projectId: selectedProject || null,
          taskId: selectedTask || null,
        }),
      })

      if (res.ok) {
        alert("Asistencia registrada exitosamente")
        setShowCheckInModal(false)
        setSelectedUser("")
        setCheckInTime("")
        setCheckOutTime("")
        setNotes("")
        setSelectedProject("")
        setSelectedTask("")
        fetchAttendances()
      } else {
        const error = await res.json()
        alert(error.error || "Error al registrar asistencia")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al registrar asistencia")
    }
  }

  const handleEdit = (item: Attendance) => {
    setSelectedAttendance(item)
    setSelectedUser(item.userId)
    setCheckInTime(new Date(item.checkIn).toTimeString().slice(0, 5))
    setCheckOutTime(
      item.checkOut ? new Date(item.checkOut).toTimeString().slice(0, 5) : "",
    )
    setNotes(item.notes || "")
    setSelectedProject(item.projectId || "")
    setSelectedTask(item.taskId || "")
    setShowEditModal(true)
  }

  const handleUpdateAttendance = async () => {
    if (!selectedAttendance || !checkInTime) return

    try {
      const [inHours, inMinutes] = checkInTime.split(":")
      const checkInDate = new Date(selectedAttendance.date)
      checkInDate.setHours(parseInt(inHours), parseInt(inMinutes), 0)

      let checkOutDate = null
      if (checkOutTime) {
        const [outHours, outMinutes] = checkOutTime.split(":")
        checkOutDate = new Date(selectedAttendance.date)
        checkOutDate.setHours(parseInt(outHours), parseInt(outMinutes), 0)
      }

      const res = await fetch(`/api/attendance/${selectedAttendance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          checkIn: checkInDate.toISOString(),
          checkOut: checkOutDate ? checkOutDate.toISOString() : null,
          notes: notes || null,
          projectId: selectedProject || null,
          taskId: selectedTask || null,
        }),
      })

      if (res.ok) {
        alert("Asistencia actualizada exitosamente")
        setShowEditModal(false)
        setSelectedAttendance(null)
        setSelectedUser("")
        setCheckInTime("")
        setCheckOutTime("")
        setNotes("")
        setSelectedProject("")
        setSelectedTask("")
        fetchAttendances()
      } else {
        alert("Error al actualizar asistencia")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar asistencia")
    }
  }

  const handleCheckOut = async () => {
    if (!selectedAttendance) return

    try {
      const res = await fetch(`/api/attendance/${selectedAttendance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          checkOut: new Date().toISOString(),
        }),
      })

      if (res.ok) {
        alert("Salida registrada exitosamente")
        setShowCheckOutModal(false)
        setSelectedAttendance(null)
        fetchAttendances()
      } else {
        alert("Error al registrar salida")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al registrar salida")
    }
  }

  const handleDelete = async (item: { id: string }) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return

    try {
      const res = await fetch(`/api/attendance/${item.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (res.ok) {
        alert("Registro eliminado exitosamente")
        fetchAttendances()
      } else {
        alert("Error al eliminar registro")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar registro")
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return "-"
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const calculateHoursDecimal = (
    checkIn: string,
    checkOut: string | null,
  ): number => {
    if (!checkOut) return 0
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    return diff / (1000 * 60 * 60) // Convertir a horas decimales
  }

  const calculateCost = (
    checkIn: string,
    checkOut: string | null,
    hourlyRate: number | null | undefined,
  ): number => {
    if (!checkOut || !hourlyRate) return 0
    const hours = calculateHoursDecimal(checkIn, checkOut)
    return hours * hourlyRate
  }

  // Calcular estadísticas por proyecto
  const getProjectStats = (projectId: string | null) => {
    if (!projectId) return { hours: 0, cost: 0 }

    const projectAttendances = attendances.filter(
      (att) => att.projectId === projectId,
    )
    const totalHours = projectAttendances.reduce(
      (sum, att) => sum + calculateHoursDecimal(att.checkIn, att.checkOut),
      0,
    )
    const totalCost = projectAttendances.reduce(
      (sum, att) =>
        sum + calculateCost(att.checkIn, att.checkOut, att.hourlyRate),
      0,
    )

    return { hours: totalHours, cost: totalCost }
  }

  const columns = [
    {
      key: "user",
      label: "Pengguna",
      sortable: true,
      searchable: true,
      render: (attendance: Attendance) => (
        <div>
          <div className="font-medium text-gray-900">
            {attendance.user.name}
          </div>
          <div className="text-sm text-gray-500">{attendance.user.email}</div>
        </div>
      ),
    },
    {
      key: "project",
      label: "Proyecto",
      render: (attendance: Attendance) => {
        if (!attendance.project)
          return <span className="text-sm text-gray-400">-</span>

        const stats = getProjectStats(attendance.projectId)
        const currentHours = calculateHoursDecimal(
          attendance.checkIn,
          attendance.checkOut,
        )

        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {attendance.project.name}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {currentHours.toFixed(2)}h / {stats.hours.toFixed(2)}h •{" "}
              {stats.cost.toFixed(2)} €
            </div>
          </div>
        )
      },
    },
    {
      key: "task",
      label: "Tarea",
      render: (attendance: Attendance) => (
        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
          {attendance.task?.title || "-"}
        </span>
      ),
    },
    {
      key: "date",
      label: "Fecha",
      sortable: true,
      render: (attendance: Attendance) =>
        new Date(attendance.date).toLocaleDateString("es-ES"),
    },
    {
      key: "checkIn",
      label: "Hora Entrada",
      sortable: true,
      render: (attendance: Attendance) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          {formatTime(attendance.checkIn)}
        </span>
      ),
    },
    {
      key: "checkOut",
      label: "Hora Salida",
      render: (attendance: Attendance) =>
        attendance.checkOut ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            {formatTime(attendance.checkOut)}
          </span>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedAttendance(attendance)
              setShowCheckOutModal(true)
            }}
          >
            Registrar Salida
          </Button>
        ),
    },
    {
      key: "hours",
      label: "Horas",
      render: (attendance: Attendance) => {
        const hoursDecimal = calculateHoursDecimal(
          attendance.checkIn,
          attendance.checkOut,
        )
        return (
          <div>
            <div className="font-medium text-gray-900">
              {calculateHours(attendance.checkIn, attendance.checkOut)}
            </div>
            {attendance.checkOut && (
              <div className="text-xs text-gray-500">
                {hoursDecimal.toFixed(2)}h
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: "hourlyRate",
      label: "Coste/Hora",
      render: (attendance: Attendance) => {
        const rate = attendance.hourlyRate ? Number(attendance.hourlyRate) : 0
        return (
          <span className="font-semibold text-blue-700 whitespace-nowrap">
            {rate.toFixed(2)} €
          </span>
        )
      },
    },
    {
      key: "cost",
      label: "Importe Total",
      render: (attendance: Attendance) => {
        const cost = calculateCost(
          attendance.checkIn,
          attendance.checkOut,
          attendance.hourlyRate,
        )
        return (
          <span
            className={`font-bold text-lg whitespace-nowrap ${cost > 0 ? "text-teal-600" : "text-gray-600"}`}
          >
            {cost.toFixed(2)} €
          </span>
        )
      },
    },
  ]

  if (loading && !activeCompany) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Control de Asistencia
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Registra entradas y salidas del personal
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            placeholder="Todas las fechas"
          />
          {selectedDate && (
            <Button variant="secondary" onClick={() => setSelectedDate("")}>
              Ver Todo
            </Button>
          )}
          <Button onClick={() => setShowCheckInModal(true)}>
            + Registrar Asistencia
          </Button>
        </div>
      </div>

      <DataTable
        title="Asistencias"
        data={attendances}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No hay registros de asistencia para esta fecha"
        showColumnToggle={false}
      />

      {/* Resumen de Totales */}
      {attendances.length > 0 && (
        <Card className="mt-4">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resumen del Día
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium mb-1">
                  Total Registros
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {attendances.length}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium mb-1">
                  Total Horas
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {attendances
                    .reduce(
                      (total, att) =>
                        total +
                        calculateHoursDecimal(att.checkIn, att.checkOut),
                      0,
                    )
                    .toFixed(2)}
                  h
                </div>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg">
                <div className="text-sm text-teal-600 font-medium mb-1">
                  Coste Total
                </div>
                <div className="text-2xl font-bold text-teal-900">
                  {attendances
                    .reduce(
                      (total, att) =>
                        total +
                        calculateCost(
                          att.checkIn,
                          att.checkOut,
                          att.hourlyRate,
                        ),
                      0,
                    )
                    .toFixed(2)}{" "}
                  €
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modal Registrar Asistencia */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 text-black">
                Registrar Asistencia
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pengguna *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="">Seleccionar usuario</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proyecto (opcional)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value)
                      setSelectedTask("")
                      if (e.target.value) {
                        fetchTasks(e.target.value)
                      } else {
                        setTasks([])
                      }
                    }}
                  >
                    <option value="">Sin proyecto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProject && tasks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarea (opcional)
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      value={selectedTask}
                      onChange={(e) => setSelectedTask(e.target.value)}
                    >
                      <option value="">Sin tarea</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Entrada (opcional)
                  </label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Si no se especifica, se usa la hora actual"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si no se especifica, se usa la hora actual
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Salida (opcional)
                  </label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Opcional"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Puedes dejarlo vacío y registrarlo después
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={3}
                    placeholder="Observaciones..."
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCheckInModal(false)
                      setSelectedUser("")
                      setCheckInTime("")
                      setCheckOutTime("")
                      setNotes("")
                      setSelectedProject("")
                      setSelectedTask("")
                      setTasks([])
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCheckIn} disabled={!selectedUser}>
                    Registrar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Registrar Salida */}
      {showCheckOutModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Registrar Salida</h2>

              <div className="space-y-4">
                <p className="text-gray-700">
                  ¿Confirmar salida para{" "}
                  <strong>{selectedAttendance.user.name}</strong>?
                </p>
                <p className="text-sm text-gray-500">
                  Hora de entrada: {formatTime(selectedAttendance.checkIn)}
                </p>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCheckOutModal(false)
                      setSelectedAttendance(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCheckOut}>Confirmar Salida</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Editar Asistencia */}
      {showEditModal && selectedAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Editar Asistencia</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pengguna
                  </label>
                  <input
                    type="text"
                    value={selectedAttendance.user.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proyecto (opcional)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    value={selectedProject}
                    onChange={(e) => {
                      setSelectedProject(e.target.value)
                      setSelectedTask("")
                      if (e.target.value) {
                        fetchTasks(e.target.value)
                      } else {
                        setTasks([])
                      }
                    }}
                  >
                    <option value="">Sin proyecto</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProject && tasks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarea (opcional)
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      value={selectedTask}
                      onChange={(e) => setSelectedTask(e.target.value)}
                    >
                      <option value="">Sin tarea</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Entrada *
                  </label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Salida (opcional)
                  </label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={3}
                    placeholder="Observaciones..."
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedAttendance(null)
                      setSelectedUser("")
                      setCheckInTime("")
                      setCheckOutTime("")
                      setNotes("")
                      setSelectedProject("")
                      setSelectedTask("")
                      setTasks([])
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleUpdateAttendance}
                    disabled={!checkInTime}
                  >
                    Actualizar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
