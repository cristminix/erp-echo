import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';
import { getEffectiveUserId } from '@/lib/user-helpers';

// GET - Listar workspaces del usuario
export async function GET(req: NextRequest) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);

    // Obtener workspaces donde el usuario es miembro
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: effectiveUserId },
      include: {
        workspace: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const workspaces = memberships.map(m => m.workspace);

    return NextResponse.json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json({ error: 'Error al obtener workspaces' }, { status: 500 });
  }
}

// POST - Crear nuevo workspace
export async function POST(req: NextRequest) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await req.json();

    const { name, slug, icon, companyId } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Nombre y slug son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el slug no exista
    const existing = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'El slug ya está en uso' },
        { status: 400 }
      );
    }

    // Crear workspace y canal general
    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        icon,
        companyId,
        createdBy: effectiveUserId,
        members: {
          create: {
            userId: effectiveUserId,
            role: 'admin',
          },
        },
        channels: {
          create: {
            name: 'general',
            description: 'Canal general del workspace',
            isPrivate: false,
            createdBy: effectiveUserId,
            members: {
              create: {
                userId: effectiveUserId,
                role: 'admin',
              },
            },
          },
        },
      },
      include: {
        channels: true,
        members: true,
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json({ error: 'Error al crear workspace' }, { status: 500 });
  }
}
