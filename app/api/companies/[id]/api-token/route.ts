import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/jwt"
import crypto from "crypto"

const prisma = new PrismaClient()

// Generar un token aleatorio seguro
function generateApiToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Verificar autenticación del usuario
async function verifyAuth(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value
    if (!token) return null

    const payload = await verifyToken(token)
    return payload
  } catch (error) {
    return null
  }
}

// GET - Obtener el token actual
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        apiKey: true,
        apiEnabled: true,
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Perusahaan no encontrada" },
        { status: 404 },
      )
    }

    // Verificar que el usuario tenga acceso a esta empresa
    if (company.id !== params.id) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    return NextResponse.json({
      apiKey: company.apiKey,
      apiEnabled: company.apiEnabled,
    })
  } catch (error) {
    console.error("Error al obtener token:", error)
    return NextResponse.json(
      { error: "Error al obtener token" },
      { status: 500 },
    )
  }
}

// POST - Generar nuevo token
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    console.log("POST api-token - ID de empresa:", params.id)

    const user = await verifyAuth(request)
    if (!user) {
      console.log("Pengguna no autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    console.log("Pengguna autenticado:", user.userId)

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    })

    if (!company) {
      console.log("Perusahaan no encontrada")
      return NextResponse.json(
        { error: "Perusahaan no encontrada" },
        { status: 404 },
      )
    }

    console.log("Perusahaan encontrada, generando token...")

    // Generar nuevo token
    const newApiKey = generateApiToken()
    console.log("Token generado:", newApiKey.substring(0, 10) + "...")

    const updatedCompany = await prisma.company.update({
      where: { id: params.id },
      data: {
        apiKey: newApiKey,
        apiEnabled: true,
      },
      select: {
        apiKey: true,
        apiEnabled: true,
      },
    })

    console.log("Token guardado exitosamente")

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error("Error al generar token:", error)
    return NextResponse.json(
      {
        error: "Error al generar token",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Habilitar/deshabilitar API
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { apiEnabled } = body

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Perusahaan no encontrada" },
        { status: 404 },
      )
    }

    const updatedCompany = await prisma.company.update({
      where: { id: params.id },
      data: { apiEnabled },
      select: {
        apiKey: true,
        apiEnabled: true,
      },
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    console.error("Error al actualizar estado de API:", error)
    return NextResponse.json(
      { error: "Error al actualizar estado de API" },
      { status: 500 },
    )
  }
}

// DELETE - Eliminar token
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Perusahaan no encontrada" },
        { status: 404 },
      )
    }

    await prisma.company.update({
      where: { id: params.id },
      data: {
        apiKey: null,
        apiEnabled: false,
      },
    })

    return NextResponse.json({ message: "Token eliminado" })
  } catch (error) {
    console.error("Error al eliminar token:", error)
    return NextResponse.json(
      { error: "Error al eliminar token" },
      { status: 500 },
    )
  }
}
