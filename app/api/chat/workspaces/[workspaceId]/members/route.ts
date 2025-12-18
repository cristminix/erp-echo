import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { getEffectiveUserId } from '@/lib/user-helpers';

// GET - Listar miembros de un workspace
export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const { workspaceId } = params;

    // Verificar que el usuario es miembro del workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: effectiveUserId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No tienes acceso a este workspace' }, { status: 403 });
    }

    // Obtener todos los miembros del workspace
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const membersList = members.map(m => ({
      ...m.user,
      status: m.status,
      role: m.role,
    }));

    return NextResponse.json(membersList);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Error al obtener miembros' }, { status: 500 });
  }
}
