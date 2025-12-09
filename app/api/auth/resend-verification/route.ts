import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const resendSchema = z.object({
  userId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resendSchema.parse(body);

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya está verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'El email ya ha sido verificado' },
        { status: 400 }
      );
    }

    // Generar nuevo código
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Actualizar usuario con nuevo código
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiry,
      },
    });

    // Enviar email
    try {
      const { sendVerificationEmail } = require('@/lib/email');
      await sendVerificationEmail(user.email, user.name, verificationCode);
    } catch (emailError) {
      console.error('Error al enviar email:', emailError);
      return NextResponse.json(
        { error: 'Error al enviar el email de verificación' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Código de verificación reenviado',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error al reenviar código:', error);
    return NextResponse.json(
      { error: 'Error al reenviar código' },
      { status: 500 }
    );
  }
}
