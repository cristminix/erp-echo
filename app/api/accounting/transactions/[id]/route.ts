import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/accounting/transactions/[id] - Obtener una transacción por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await prisma.accountingTransaction.findUnique({
      where: { id: params.id },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transacción no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error al obtener transacción:', error);
    return NextResponse.json(
      { error: 'Error al obtener transacción' },
      { status: 500 }
    );
  }
}

// PUT /api/accounting/transactions/[id] - Actualizar una transacción
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { code, name, url, active } = body;

    const transaction = await prisma.accountingTransaction.update({
      where: { id: params.id },
      data: {
        code,
        name,
        url,
        active,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error al actualizar transacción:', error);
    return NextResponse.json(
      { error: 'Error al actualizar transacción' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounting/transactions/[id] - Eliminar una transacción
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.accountingTransaction.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Transacción eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar transacción:', error);
    return NextResponse.json(
      { error: 'Error al eliminar transacción' },
      { status: 500 }
    );
  }
}
