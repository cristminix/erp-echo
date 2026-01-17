import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/jwt"
import { randomBytes } from "crypto"

// Generar token único para asistencia
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const payload = await verifyAuth(req)
    console.log("POST Token - Payload:", payload)

    if (!payload) {
      console.log("POST Token - No payload")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      console.log("POST Token - Pengguna no encontrado:", params.id)
      return NextResponse.json(
        { error: "Pengguna no encontrado" },
        { status: 404 },
      )
    }

    // Generar token único
    const attendanceToken = randomBytes(32).toString("hex")

    // Actualizar usuario con el token
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { attendanceToken },
      select: {
        id: true,
        name: true,
        email: true,
        attendanceToken: true,
      },
    })

    return NextResponse.json({
      token: updatedUser.attendanceToken,
      url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/attendance/${updatedUser.attendanceToken}`,
    })
  } catch (error) {
    console.error("Error generando token de asistencia:", error)
    return NextResponse.json(
      { error: "Error generando token de asistencia" },
      { status: 500 },
    )
  }
}

// Obtener token actual
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const payload = await verifyAuth(req)
    console.log("GET Token - Payload:", payload)

    if (!payload) {
      console.log("GET Token - No payload")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        attendanceToken: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna no encontrado" },
        { status: 404 },
      )
    }

    if (!user.attendanceToken) {
      return NextResponse.json({ error: "Token no generado" }, { status: 404 })
    }

    return NextResponse.json({
      token: user.attendanceToken,
      url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/attendance/${user.attendanceToken}`,
    })
  } catch (error) {
    console.error("Error obteniendo token de asistencia:", error)
    return NextResponse.json(
      { error: "Error obteniendo token de asistencia" },
      { status: 500 },
    )
  }
}
