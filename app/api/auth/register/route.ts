import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { signToken } from "@/lib/jwt"
import { sendVerificationEmail } from "@/lib/email"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
})

export async function POST(request: NextRequest) {
  try {
    // Verificar si el registro está permitido
    if (process.env.ALLOW_REGISTRATION !== "true") {
      return NextResponse.json(
        { error: "El registro de nuevos usuarios está deshabilitado" },
        { status: 403 },
      )
    }

    const body = await request.json()

    // Validar datos
    const validatedData = registerSchema.parse(body)

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 },
      )
    }

    // Crear usuario
    const hashedPassword = await hashPassword(validatedData.password)

    // Generar código de verificación si está habilitado
    const requireVerification =
      process.env.REQUIRE_EMAIL_VERIFICATION === "true"
    const verificationCode = requireVerification
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : null
    const verificationCodeExpiry = requireVerification
      ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
      : null

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        emailVerified: !requireVerification,
        verificationCode,
        verificationCodeExpiry,
      },
    })

    // Crear empresa por defecto con el nombre del usuario
    await prisma.company.create({
      data: {
        name: validatedData.name,
        userId: user.id,
        email: validatedData.email,
        currency: "USD",
        primaryColor: "#0d9488",
        secondaryColor: "#14b8a6",
        active: true,
      },
    })

    // Si requiere verificación, enviar email
    if (requireVerification && verificationCode) {
      try {
        await sendVerificationEmail(user.email, user.name, verificationCode)
      } catch (emailError) {
        console.error("Error al enviar email de verificación:", emailError)
        // No fallar el registro si falla el email
      }
    }

    // Si no requiere verificación, crear token inmediatamente
    if (!requireVerification) {
      const token = await signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })

      const response = NextResponse.json(
        {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        { status: 201 },
      )

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })

      return response
    }

    // Si requiere verificación, devolver mensaje
    return NextResponse.json(
      {
        success: true,
        requiresVerification: true,
        userId: user.id,
        message:
          "Pengguna registrado. Por favor verifica tu email con el código enviado.",
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 },
      )
    }

    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 },
    )
  }
}
