import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { getEffectiveUserId } from '@/lib/user-helpers';

// GET - Obtener mensajes de una conversación directa
export async function GET(
  req: NextRequest,
  { params }: { params: { dmId: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const { dmId } = params;

    // Verificar que el usuario es participante de esta conversación
    const participant = await prisma.directMessageParticipant.findUnique({
      where: {
        directMessageId_userId: {
          directMessageId: dmId,
          userId: effectiveUserId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'No tienes acceso a esta conversación' }, { status: 403 });
    }

    // Obtener los mensajes
    const messages = await prisma.message.findMany({
      where: { directMessageId: dmId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100,
    });

    // Agrupar reacciones
    const messagesWithReactions = messages.map(msg => ({
      ...msg,
      reactions: msg.reactions.reduce((acc: any[], reaction) => {
        const existing = acc.find(r => r.emoji === reaction.emoji);
        if (existing) {
          existing.count++;
          existing.users.push(reaction.user);
        } else {
          acc.push({
            emoji: reaction.emoji,
            count: 1,
            users: [reaction.user],
          });
        }
        return acc;
      }, []),
      replyCount: 0, // children count removed
    }));

    return NextResponse.json(messagesWithReactions);
  } catch (error) {
    console.error('Error fetching DM messages:', error);
    return NextResponse.json({ error: 'Error al obtener mensajes' }, { status: 500 });
  }
}

// POST - Enviar mensaje en conversación directa
export async function POST(
  req: NextRequest,
  { params }: { params: { dmId: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const { dmId } = params;
    const { content, parentId } = await req.json();

    // Verificar que el usuario es participante
    const participant = await prisma.directMessageParticipant.findUnique({
      where: {
        directMessageId_userId: {
          directMessageId: dmId,
          userId: effectiveUserId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'No tienes acceso a esta conversación' }, { status: 403 });
    }

    // Crear el mensaje
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        userId: effectiveUserId,
        directMessageId: dmId,
        parentId: parentId || null,
      },
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

    // Detectar menciones
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    if (mentions) {
      for (const mention of mentions) {
        const username = mention.substring(1);
        const mentionedUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { contains: username } },
              { name: { contains: username } },
            ],
          },
        });

        if (mentionedUser) {
          await prisma.messageMention.create({
            data: {
              messageId: message.id,
              userId: mentionedUser.id,
            },
          });
        }
      }
    }

    // Actualizar lastReadAt del usuario actual
    await prisma.directMessageParticipant.update({
      where: {
        directMessageId_userId: {
          directMessageId: dmId,
          userId: effectiveUserId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error creating DM message:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
