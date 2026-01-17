"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import {
  HashtagIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
  EllipsisVerticalIcon,
  UserGroupIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline"

interface User {
  id: string
  name: string
  email?: string
  avatar?: string
  status: string
}

interface Channel {
  id: string
  name: string
  description?: string
  isPrivate: boolean
  messageCount?: number
}

interface Message {
  id: string
  content: string
  userId: string
  user: User
  createdAt: string
  reactions?: { emoji: string; count: number; users: string[] }[]
}

export default function ChatPage() {
  const { primaryColor, secondaryColor } = useTheme()
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<any>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelDescription, setNewChannelDescription] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [directMessages, setDirectMessages] = useState<any[]>([])
  const [activeDM, setActiveDM] = useState<any>(null)
  const [showUserSelect, setShowUserSelect] = useState(false)
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([])
  const [viewType, setViewType] = useState<"channel" | "dm">("channel")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  useEffect(() => {
    if (activeChannel && viewType === "channel") {
      loadMessages()
    } else if (activeDM && viewType === "dm") {
      loadDMMessages()
    }
  }, [activeChannel, activeDM, viewType])

  useEffect(() => {
    if (activeWorkspace) {
      loadChannels(activeWorkspace.id)
      loadDirectMessages()
    }
  }, [activeWorkspace])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadWorkspaces = async () => {
    try {
      // Obtener información del usuario actual
      const userRes = await fetch("/api/auth/me")
      if (userRes.ok) {
        const userData = await userRes.json()
        setCurrentUserId(userData.id)
      }

      const res = await fetch("/api/chat/workspaces")

      if (res.ok) {
        const data = await res.json()

        // Si no hay workspaces, inicializar uno por defecto
        if (data.length === 0) {
          const initRes = await fetch("/api/chat/init", {
            method: "POST",
          })

          if (initRes.ok) {
            // Recargar workspaces
            const reloadRes = await fetch("/api/chat/workspaces")
            if (reloadRes.ok) {
              const newData = await reloadRes.json()
              setWorkspaces(newData)
              if (newData.length > 0) {
                setActiveWorkspace(newData[0])
                loadChannels(newData[0].id)
              }
            }
          }
        } else {
          setWorkspaces(data)
          if (data.length > 0) {
            setActiveWorkspace(data[0])
            loadChannels(data[0].id)
          }
        }
      }
    } catch (error) {
      console.error("Error loading workspaces:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadChannels = async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/chat/workspaces/${workspaceId}/channels`)

      if (res.ok) {
        const data = await res.json()
        setChannels(data)
        if (data.length > 0) {
          setActiveChannel(data[0])
        }
      }
    } catch (error) {
      console.error("Error loading channels:", error)
    }
  }

  const loadDirectMessages = async () => {
    try {
      const res = await fetch("/api/chat/direct-messages")

      if (res.ok) {
        const data = await res.json()
        setDirectMessages(
          data.filter((dm: any) => dm.workspace.id === activeWorkspace?.id),
        )
      }
    } catch (error) {
      console.error("Error loading DMs:", error)
    }
  }

  const loadDMMessages = async () => {
    if (!activeDM) return

    try {
      const res = await fetch(
        `/api/chat/direct-messages/${activeDM.id}/messages`,
      )

      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error loading DM messages:", error)
    }
  }

  const loadMessages = async () => {
    if (!activeChannel) return

    try {
      const res = await fetch(`/api/chat/channels/${activeChannel.id}/messages`)

      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeChannel) return

    try {
      const res = await fetch(
        `/api/chat/channels/${activeChannel.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newMessage }),
        },
      )

      if (res.ok) {
        setNewMessage("")
        loadMessages()
      }
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const loadWorkspaceUsers = async () => {
    if (!activeWorkspace) {
      console.log("No hay workspace activo")
      return
    }

    try {
      console.log("Cargando usuarios del workspace:", activeWorkspace.id)
      const res = await fetch(
        `/api/chat/workspaces/${activeWorkspace.id}/members`,
      )

      if (res.ok) {
        const data = await res.json()
        console.log("Usuarios cargados:", data)
        setWorkspaceUsers(data)
        setShowUserSelect(true)
      } else {
        console.error("Error al cargar usuarios:", res.status, await res.text())
        alert("Error al cargar la lista de usuarios")
      }
    } catch (error) {
      console.error("Error loading users:", error)
      alert(
        "Error al cargar usuarios: " +
          (error instanceof Error ? error.message : "Unknown error"),
      )
    }
  }

  const startDirectMessage = async (userId: string) => {
    try {
      const res = await fetch("/api/chat/direct-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId: activeWorkspace.id,
          otherUserId: userId,
        }),
      })

      if (res.ok) {
        const dm = await res.json()
        setActiveDM(dm)
        setActiveChannel(null)
        setViewType("dm")
        setShowUserSelect(false)
        loadDirectMessages()
      }
    } catch (error) {
      console.error("Error creating DM:", error)
      alert("Error al crear conversación")
    }
  }

  const createChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim() || !activeWorkspace) return

    try {
      const res = await fetch(
        `/api/chat/workspaces/${activeWorkspace.id}/channels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newChannelName.toLowerCase().replace(/\s+/g, "-"),
            description: newChannelDescription,
            isPrivate,
          }),
        },
      )

      if (res.ok) {
        setNewChannelName("")
        setNewChannelDescription("")
        setIsPrivate(false)
        setShowCreateChannel(false)
        loadChannels(activeWorkspace.id)
      } else {
        alert("Error al crear el canal")
      }
    } catch (error) {
      console.error("Error creating channel:", error)
      alert("Error al crear el canal")
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Hoy"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ayer"
    } else {
      return date.toLocaleDateString("es-ES", { day: "numeric", month: "long" })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <ChatBubbleLeftIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Bienvenido a Comunicación
          </h2>
          <p className="mt-2 text-gray-600">
            Crea tu primer workspace para empezar
          </p>
          <button
            className="mt-6 inline-flex items-center px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Workspace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Sidebar izquierda - Canales */}
      <div className="w-64 bg-gray-800 text-white flex flex-col h-full">
        {/* Buscar */}
        <div className="px-3 py-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar canales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-700 text-white placeholder-gray-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gray-600"
            />
          </div>
        </div>

        {/* Lista de canales */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">Canales</h3>
              <button
                onClick={() => setShowCreateChannel(true)}
                className="p-0.5 hover:bg-gray-700 rounded"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {channels
              .filter((channel) =>
                channel.name.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setActiveChannel(channel)
                    setActiveDM(null)
                    setViewType("channel")
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded mb-0.5 text-left transition-colors ${
                    activeChannel?.id === channel.id
                      ? "text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                  style={
                    activeChannel?.id === channel.id
                      ? { backgroundColor: primaryColor }
                      : {}
                  }
                >
                  <HashtagIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate flex-1">
                    {channel.name}
                  </span>
                  {channel.messageCount && channel.messageCount > 0 && (
                    <span className="bg-gray-600 text-white text-xs rounded-full px-2 py-0.5 flex-shrink-0">
                      {channel.messageCount}
                    </span>
                  )}
                </button>
              ))}
          </div>

          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">
                Mensajes directos
              </h3>
              <button
                onClick={loadWorkspaceUsers}
                className="p-0.5 hover:bg-gray-700 rounded"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {directMessages.map((dm) => (
              <button
                key={dm.id}
                onClick={() => {
                  setActiveDM(dm)
                  setActiveChannel(null)
                  setViewType("dm")
                }}
                className={`w-full flex items-center px-2 py-1.5 rounded mb-0.5 text-left transition-colors ${
                  activeDM?.id === dm.id
                    ? "text-white"
                    : "text-gray-300 hover:bg-gray-700"
                }`}
                style={
                  activeDM?.id === dm.id
                    ? { backgroundColor: primaryColor }
                    : {}
                }
              >
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white mr-2 flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {dm.otherUser?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <span className="text-sm truncate">
                  {dm.otherUser?.name || "Pengguna"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Área principal - Chat */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeChannel || activeDM ? (
          <>
            {/* Header del canal o DM */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center">
                    {viewType === "channel" ? (
                      <>
                        <HashtagIcon className="h-5 w-5 text-gray-500 mr-2" />
                        <h2 className="text-lg font-bold text-gray-900">
                          {activeChannel?.name}
                        </h2>
                      </>
                    ) : (
                      <>
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold text-white mr-2"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                          }}
                        >
                          {activeDM?.otherUser?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {activeDM?.otherUser?.name || "Pengguna"}
                        </h2>
                      </>
                    )}
                  </div>
                  {viewType === "channel" && activeChannel?.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {activeChannel.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {viewType === "channel" && (
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <UserGroupIcon className="h-5 w-5 text-gray-600" />
                    </button>
                  )}
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 bg-white min-h-0">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No hay mensajes aún. ¡Sé el primero en escribir!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    return (
                      <div key={message.id}>
                        <div className="flex gap-3 hover:bg-gray-50 px-4 py-2 -mx-4 rounded">
                          <div
                            className="w-10 h-10 rounded flex items-center justify-center text-white font-bold flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                            }}
                          >
                            {message.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900">
                                {message.user.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-900 whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            {message.reactions &&
                              message.reactions.length > 0 && (
                                <div className="flex gap-1 mt-2">
                                  {message.reactions.map((reaction, i) => (
                                    <button
                                      key={i}
                                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm flex items-center gap-1"
                                    >
                                      <span>{reaction.emoji}</span>
                                      <span className="text-gray-600">
                                        {reaction.count}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input de mensaje */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
              <form onSubmit={sendMessage} className="relative">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage(e)
                        }
                      }}
                      placeholder={
                        viewType === "channel"
                          ? `Mensaje a #${activeChannel?.name}`
                          : `Mensaje a ${activeDM?.otherUser?.name}`
                      }
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 resize-none text-gray-900"
                      rows={1}
                      style={{
                        minHeight: "44px",
                        maxHeight: "200px",
                        borderColor: "#d1d5db",
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = primaryColor
                        e.currentTarget.style.boxShadow = `0 0 0 1px ${primaryColor}`
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#d1d5db"
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-3 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <HashtagIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">
                Selecciona un canal para comenzar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal para crear canal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Crear nuevo canal
            </h2>
            <form onSubmit={createChannel}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del canal
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">#</span>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="nombre-del-canal"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Los nombres deben estar en minúsculas, sin espacios ni puntos
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newChannelDescription}
                  onChange={(e) => setNewChannelDescription(e.target.value)}
                  placeholder="¿De qué trata este canal?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    Hacer este canal privado
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Solo los miembros invitados pueden ver y unirse a canales
                  privados
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateChannel(false)
                    setNewChannelName("")
                    setNewChannelDescription("")
                    setIsPrivate(false)
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newChannelName.trim()}
                  className="px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                >
                  Crear canal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para seleccionar usuario para DM */}
      {showUserSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Iniciar mensaje directo
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona un usuario para iniciar una conversación
            </p>
            <div className="space-y-2">
              {workspaceUsers.filter((u) => u.id !== currentUserId).length ===
              0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No hay otros usuarios en este workspace.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Invita a más usuarios para poder enviar mensajes directos.
                  </p>
                </div>
              ) : (
                workspaceUsers
                  .filter((u) => u.id !== currentUserId)
                  .map((user) => (
                    <button
                      key={user.id}
                      onClick={() => startDirectMessage(user.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                      >
                        {user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowUserSelect(false)
                  setWorkspaceUsers([])
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
