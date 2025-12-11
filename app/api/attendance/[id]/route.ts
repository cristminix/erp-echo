import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Error al obtener registro de asistencia' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    const { checkIn, checkOut, notes, projectId, taskId } = data;

    const updateData: any = {};
    if (checkIn !== undefined) updateData.checkIn = new Date(checkIn);
    if (checkOut !== undefined) updateData.checkOut = checkOut ? new Date(checkOut) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (projectId !== undefined) updateData.projectId = projectId || null;
    if (taskId !== undefined) updateData.taskId = taskId || null;

    const attendance = await prisma.attendance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { error: 'Error al actualizar registro de asistencia' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(req);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await prisma.attendance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { error: 'Error al eliminar registro de asistencia' },
      { status: 500 }
    );
  }
}
