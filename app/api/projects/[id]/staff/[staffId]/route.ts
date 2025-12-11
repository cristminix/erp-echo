import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

// Schema de validación para actualizar personal
const updateStaffSchema = z.object({
  hourlyRate: z.number().positive().optional(),
  role: z.string().optional(),
});

// PUT /api/projects/[id]/staff/[staffId] - Actualizar personal del proyecto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; staffId: string } }
) {
  try {
    const decoded = await verifyAuth(request);
    if (!decoded) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, staffId } = params;
    const body = await request.json();

    // Validar datos
    const validatedData = updateStaffSchema.parse(body);

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

    // Verificar que el staff existe
    const existingStaff = await prisma.projectStaff.findFirst({
      where: {
        id: staffId,
        projectId: id,
      },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: 'Personal no encontrado' }, { status: 404 });
    }

    // Actualizar el personal
    const updatedStaff = await prisma.projectStaff.update({
      where: { id: staffId },
      data: validatedData,
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

    return NextResponse.json(updatedStaff);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating project staff:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el personal del proyecto' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/staff/[staffId] - Eliminar personal del proyecto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; staffId: string } }
) {
  try {
    const decoded = await verifyAuth(request);
    if (!decoded) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, staffId } = params;

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

    // Verificar que el staff existe
    const existingStaff = await prisma.projectStaff.findFirst({
      where: {
        id: staffId,
        projectId: id,
      },
    });

    if (!existingStaff) {
      return NextResponse.json({ error: 'Personal no encontrado' }, { status: 404 });
    }

    // Eliminar el personal
    await prisma.projectStaff.delete({
      where: { id: staffId },
    });

    return NextResponse.json({ message: 'Personal eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting project staff:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el personal del proyecto' },
      { status: 500 }
    );
  }
}
