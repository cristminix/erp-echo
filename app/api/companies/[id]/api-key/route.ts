import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Genera una nueva API Key para la empresa
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string };

    // Verificar que la empresa existe y pertenece al usuario
    const company = await prisma.company.findFirst({
      where: {
        id: params.id,
        userId: decoded.userId
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Generar una nueva API Key única
    const apiKey = `fc_${crypto.randomBytes(32).toString('hex')}`;

    // Actualizar la empresa con la nueva API Key
    const updatedCompany = await prisma.company.update({
      where: { id: params.id },
      data: { 
        apiKey,
        apiEnabled: true // Al generar una clave, se activa automáticamente la API
      }
    });

    return NextResponse.json({
      apiKey: updatedCompany.apiKey,
      apiEnabled: updatedCompany.apiEnabled
    });
  } catch (error: any) {
    console.error('Error generating API key:', error);
    return NextResponse.json(
      { error: 'Error al generar la clave de API' },
      { status: 500 }
    );
  }
}
