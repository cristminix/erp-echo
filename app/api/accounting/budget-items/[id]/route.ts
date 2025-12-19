import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const budgetItem = await prisma.budgetItem.findUnique({
      where: { id: params.id },
    });

    if (!budgetItem) {
      return NextResponse.json(
        { error: 'Partida no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(budgetItem);
  } catch (error) {
    console.error('Error fetching budget item:', error);
    return NextResponse.json(
      { error: 'Error al cargar la partida' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { code, name, active } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const budgetItem = await prisma.budgetItem.update({
      where: { id: params.id },
      data: {
        code,
        name,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(budgetItem);
  } catch (error) {
    console.error('Error updating budget item:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la partida' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.budgetItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting budget item:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la partida' },
      { status: 500 }
    );
  }
}
