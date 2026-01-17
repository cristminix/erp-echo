import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/jwt"
import { getEffectiveUserId } from "@/lib/user-helpers"

// POST - Inicializar workspace por defecto
export async function POST(req: NextRequest) {
  try {
    const payload = await verifyAuth(req)
    if (!payload) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId)

    // Verificar si ya tiene workspaces
    const existingMembership = await prisma.workspaceMember.findFirst({
      where: { userId: effectiveUserId },
    })

    if (existingMembership) {
      return NextResponse.json(
        { message: "Ya tienes un workspace" },
        { status: 200 },
      )
    }

    // Obtener compañía activa del usuario
    const companies = await prisma.company.findMany({
      where: {
        userId: effectiveUserId,
        active: true,
      },
    })

    const companyId = companies.length > 0 ? companies[0].id : null
    const companyName =
      companies.length > 0 ? companies[0].name : "Mi Perusahaan"

    // Crear workspace y canal general
    const workspace = await prisma.workspace.create({
      data: {
        name: companyName,
        slug: `workspace-${Date.now()}`,
        icon: "🏢",
        companyId,
        createdBy: effectiveUserId,
        members: {
          create: {
            userId: effectiveUserId,
            role: "admin",
          },
        },
        channels: {
          create: [
            {
              name: "general",
              description: "Canal general del equipo",
              topic: "Conversaciones generales y anuncios",
              isPrivate: false,
              createdBy: effectiveUserId,
              members: {
                create: {
                  userId: effectiveUserId,
                  role: "admin",
                },
              },
            },
            {
              name: "random",
              description: "Conversaciones casuales",
              topic: "Todo lo que no sea trabajo",
              isPrivate: false,
              createdBy: effectiveUserId,
              members: {
                create: {
                  userId: effectiveUserId,
                  role: "admin",
                },
              },
            },
          ],
        },
      },
      include: {
        channels: true,
        members: true,
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error("Error initializing workspace:", error)
    return NextResponse.json(
      { error: "Error al inicializar workspace" },
      { status: 500 },
    )
  }
}
