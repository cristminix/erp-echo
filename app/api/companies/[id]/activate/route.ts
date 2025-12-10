import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';

// POST /api/companies/[id]/activate - Activar empresa
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    // Verificar que la empresa pertenece al usuario
    const company = await prisma.company.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Desactivar todas las empresas del usuario
    await prisma.company.updateMany({
      where: { userId: effectiveUserId },
      data: { active: false }
    });

    // Activar la empresa seleccionada
    const updatedCompany = await prisma.company.update({
      where: { id: params.id },
      data: { active: true }
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error activating company:', error);
    return NextResponse.json(
      { error: 'Error al activar empresa' },
      { status: 500 }
    );
  }
}
