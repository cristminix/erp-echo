import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { getEffectiveUserId } from '@/lib/user-helpers';

// GET - Listar conversaciones directas del usuario
export async function GET(req: NextRequest) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    // Obtener todas las conversaciones directas donde el usuario participa
    const dms = await prisma.directMessageParticipant.findMany({
      where: { userId: effectiveUserId },
      include: {
        directMessage: {
          include: {
            participants: {
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
            },
            workspace: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastReadAt: 'desc',
      },
    });

    const conversations = dms.map(dm => {
      // Encontrar el otro participante
      const otherParticipant = dm.directMessage.participants.find(
        p => p.userId !== effectiveUserId
      );

      return {
        id: dm.directMessage.id,
        workspace: dm.directMessage.workspace,
        otherUser: otherParticipant?.user,
        lastReadAt: dm.lastReadAt,
      };
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    return NextResponse.json({ error: 'Error al obtener mensajes directos' }, { status: 500 });
  }
}

// POST - Crear o encontrar conversación directa con un usuario
export async function POST(req: NextRequest) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const { workspaceId, otherUserId } = await req.json();

    // Verificar que ambos usuarios son miembros del workspace
    const [user1Membership, user2Membership] = await Promise.all([
      prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: effectiveUserId,
          },
        },
      }),
      prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: otherUserId,
          },
        },
      }),
    ]);

    if (!user1Membership || !user2Membership) {
      return NextResponse.json({ error: 'Uno de los usuarios no es miembro del workspace' }, { status: 403 });
    }

    // Buscar si ya existe una conversación directa entre estos dos usuarios
    const existingDm = await prisma.directMessage.findFirst({
      where: {
        workspaceId,
        participants: {
          every: {
            userId: {
              in: [effectiveUserId, otherUserId],
            },
          },
        },
      },
      include: {
        participants: {
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
        },
      },
    });

    if (existingDm) {
      const otherParticipant = existingDm.participants.find(p => p.userId !== effectiveUserId);
      return NextResponse.json({
        id: existingDm.id,
        otherUser: otherParticipant?.user,
      });
    }

    // Crear nueva conversación directa
    const newDm = await prisma.directMessage.create({
      data: {
        workspaceId,
        participants: {
          create: [
            { userId: effectiveUserId },
            { userId: otherUserId },
          ],
        },
      },
      include: {
        participants: {
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
        },
      },
    });

    const otherParticipant = newDm.participants.find(p => p.userId !== effectiveUserId);

    return NextResponse.json({
      id: newDm.id,
      otherUser: otherParticipant?.user,
    });
  } catch (error) {
    console.error('Error creating direct message:', error);
    return NextResponse.json({ error: 'Error al crear conversación directa' }, { status: 500 });
  }
}
