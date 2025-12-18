import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { getEffectiveUserId } from '@/lib/user-helpers';

// GET - Listar mensajes de un canal
export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const { channelId } = params;

    // Verificar que el usuario es miembro del canal
    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: effectiveUserId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No tienes acceso a este canal' }, { status: 403 });
    }

    // Obtener mensajes
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        parentId: null, // Solo mensajes principales, no replies
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100, // Limitar a últimos 100 mensajes
    });

    // Agrupar reacciones
    const messagesWithReactions = messages.map(msg => ({
      ...msg,
      user: {
        id: msg.user.id,
        name: msg.user.name,
        avatar: msg.user.avatar,
        status: 'active',
      },
      reactions: Object.values(
        msg.reactions.reduce((acc: any, reaction) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
              emoji: reaction.emoji,
              count: 0,
              users: [],
            };
          }
          acc[reaction.emoji].count++;
          acc[reaction.emoji].users.push(reaction.user.id);
          return acc;
        }, {})
      ),
      replyCount: msg._count.replies,
    }));

    return NextResponse.json(messagesWithReactions);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

// POST - Enviar mensaje
export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const { channelId } = params;
    const body = await req.json();

    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }

    // Verificar que el usuario es miembro del canal
    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: effectiveUserId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No tienes acceso a este canal' }, { status: 403 });
    }

    // Crear mensaje
    const message = await prisma.message.create({
      data: {
        channelId,
        userId: effectiveUserId,
        content: content.trim(),
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Detectar y crear menciones
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    if (mentions) {
      const mentionedUsernames = mentions.map((m: string) => m.slice(1));
      const mentionedUsers = await prisma.user.findMany({
        where: {
          name: {
            in: mentionedUsernames,
          },
        },
      });

      await prisma.messageMention.createMany({
        data: mentionedUsers.map(user => ({
          messageId: message.id,
          userId: user.id,
        })),
        skipDuplicates: true,
      });
    }

    // Actualizar lastReadAt del usuario
    await prisma.channelMember.update({
      where: {
        channelId_userId: {
          channelId,
          userId: effectiveUserId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
