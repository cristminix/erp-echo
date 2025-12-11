import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

// Schema de validación para agregar personal
const addStaffSchema = z.object({
  userId: z.string(),
  hourlyRate: z.number().positive(),
  role: z.string().optional(),
});

// GET /api/projects/[id]/staff - Obtener personal del proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = await verifyAuth(request);
    if (!decoded) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Verificar que el proyecto existe y pertenece al usuario
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: decoded.userId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Obtener el personal del proyecto
    const staff = await prisma.projectStaff.findMany({
      where: {
        projectId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching project staff:', error);
    return NextResponse.json(
      { error: 'Error al obtener el personal del proyecto' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/staff - Agregar personal al proyecto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = await verifyAuth(request);
    if (!decoded) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Validar datos
    const validatedData = addStaffSchema.parse(body);

    // Verificar que el proyecto existe y pertenece al usuario
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: decoded.userId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario a agregar existe
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario no esté ya asignado
    const existing = await prisma.projectStaff.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: validatedData.userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'El usuario ya está asignado a este proyecto' },
        { status: 400 }
      );
    }

    // Agregar el personal al proyecto
    const staff = await prisma.projectStaff.create({
      data: {
        projectId: id,
        userId: validatedData.userId,
        hourlyRate: validatedData.hourlyRate,
        role: validatedData.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
          },
        },
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error adding project staff:', error);
    return NextResponse.json(
      { error: 'Error al agregar personal al proyecto' },
      { status: 500 }
    );
  }
}
