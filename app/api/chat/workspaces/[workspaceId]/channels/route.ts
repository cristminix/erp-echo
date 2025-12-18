import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { getEffectiveUserId } from '@/lib/user-helpers';

// GET - Listar canales de un workspace
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

    // Obtener canales donde el usuario es miembro
    const channelMemberships = await prisma.channelMember.findMany({
      where: {
        userId: effectiveUserId,
        channel: {
          workspaceId,
        },
      },
      include: {
        channel: {
          include: {
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
      },
    });

    const channels = channelMemberships.map(m => ({
      ...m.channel,
      messageCount: m.channel._count.messages,
    }));

    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Error al obtener canales' }, { status: 500 });
  }
}

// POST - Crear nuevo canal
export async function POST(
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
    const body = await req.json();

    const { name, description, isPrivate } = body;

    if (!name) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

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

    // Crear canal
    const channel = await prisma.channel.create({
      data: {
        workspaceId,
        name,
        description,
        isPrivate: isPrivate || false,
        createdBy: effectiveUserId,
        members: {
          create: {
            userId: effectiveUserId,
            role: 'admin',
          },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json({ error: 'Error al crear canal' }, { status: 500 });
  }
}
