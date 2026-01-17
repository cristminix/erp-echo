import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

// POST - Solicitar código de recuperación
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 },
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Por seguridad, siempre devolvemos éxito aunque el usuario no exista
    if (!user) {
      return NextResponse.json({
        message: "Si el correo existe, recibirás un código de recuperación",
      })
    }

    // Generar código de 6 dígitos
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString()
    const expiry = new Date()
    expiry.setHours(expiry.getHours() + 1) // Válido por 1 hora

    // Guardar código en la BD
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiry: expiry,
      },
    })

    // Enviar email
    try {
      await sendRecoveryEmail(user.email, user.name, verificationCode)
    } catch (emailError) {
      console.error("Error enviando email de recuperación:", emailError)
    }

    return NextResponse.json({
      message: "Si el correo existe, recibirás un código de recuperación",
    })
  } catch (error) {
    console.error("Error en forgot-password:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 },
    )
  }
}

async function sendRecoveryEmail(to: string, name: string, code: string) {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = parseInt(process.env.SMTP_PORT || "587")
  const smtpUser = process.env.SMTP_USER
  const smtpPassword = process.env.SMTP_PASSWORD
  const smtpFrom = process.env.SMTP_FROM || "noreply@falconerp.xyz"

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.log("⚠️  Configuración SMTP no completa.")
    console.log("📧 Código de recuperación para", to, ":", code)
    console.log(
      "💡 Configura SMTP_HOST, SMTP_USER y SMTP_PASSWORD en .env para enviar emails",
    )
    return
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })

  const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0d9488 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #0d9488; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${name}</strong>,</p>
              <p>Has solicitado recuperar tu contraseña. Usa el siguiente código para restablecer tu contraseña:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
                <p style="margin-top: 10px; color: #6b7280;">Este código expira en 1 hora</p>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong> Si no solicitaste este código, ignora este mensaje. Tu contraseña permanecerá segura.
              </div>

              <p>Para restablecer tu contraseña, ingresa este código en la página de recuperación.</p>
            </div>
            <div class="footer">
              <p>© 2025 Echo ERP. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject: "Código de recuperación de contraseña - Echo ERP",
    html,
  })

  console.log("✅ Email de recuperación enviado a:", to)
}
