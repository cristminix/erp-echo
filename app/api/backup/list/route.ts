import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener todos los respaldos, ordenados por fecha (más recientes primero)
    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        size: true,
        createdBy: true,
        createdAt: true,
      },
    });

    return NextResponse.json(backups, { status: 200 });
  } catch (error: any) {
    console.error('Error al listar respaldos:', error);
    return NextResponse.json(
      { error: `Error al listar respaldos: ${error.message}` },
      { status: 500 }
    );
  }
}
