import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { comparePassword } from "@/lib/auth"
import { signToken } from "@/lib/jwt"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi diperlukan"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos
    const validatedData = loginSchema.parse(body)

    // Buscar usuario con empresa por defecto
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        defaultCompany: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Kredensial tidak valid" },
        { status: 401 },
      )
    }

    // Verificar contraseña
    const isValidPassword = await comparePassword(
      validatedData.password,
      user.password,
    )

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Kredensial tidak valid" },
        { status: 401 },
      )
    }

    // Crear token JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    // Crear respuesta con cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          defaultCompany: user.defaultCompany,
        },
      },
      { status: 200 },
    )

    // Establecer cookie con el token
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Data tidak valid", details: error.issues },
        { status: 400 },
      )
    }

    console.error("Error en login:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 },
    )
  }
}
