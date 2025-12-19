import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/payments/[id] - Obtener un pago por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        journal: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        budgetItem: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        property: {
          select: {
            id: true,
            code: true,
            address: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}

// PUT /api/payments/[id] - Actualizar un pago
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { amount, date, journalId, contactId, projectId, description, concepto, budgetItemId, propertyId, type, estado } = body;

    const updateData: any = {};
    
    if (amount !== undefined) updateData.amount = Number(amount);
    if (date) updateData.date = new Date(date);
    if (type) updateData.type = type;
    if (estado) updateData.estado = estado;
    
    updateData.journalId = journalId || null;
    updateData.contactId = contactId || null;
    updateData.projectId = projectId || null;
    updateData.description = description || null;
    updateData.concepto = concepto || null;
    updateData.budgetItemId = budgetItemId || null;
    updateData.propertyId = propertyId || null;

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/[id] - Eliminar un pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.payment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
