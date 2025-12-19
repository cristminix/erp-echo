import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const type = searchParams.get('type');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const where: any = {
      companyId,
    };

    if (type) {
      where.type = type;
    }

    const payments = await prisma.payment.findMany({
      where,
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
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, type, amount, date, journalId, contactId, projectId, description, concepto, budgetItemId, propertyId, estado } = body;

    if (!companyId || !type || !amount || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Obtener la compañía para generar el número
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        paymentEntradaPrefix: true,
        paymentEntradaNextNumber: true,
        paymentSalidaPrefix: true,
        paymentSalidaNextNumber: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Generar el número según el tipo
    const isEntrada = type === 'ENTRADA';
    const prefix = isEntrada ? company.paymentEntradaPrefix : company.paymentSalidaPrefix;
    const nextNumber = isEntrada ? company.paymentEntradaNextNumber : company.paymentSalidaNextNumber;
    const number = `${prefix}-${String(nextNumber).padStart(4, '0')}`;

    // Crear el pago
    const payment = await prisma.payment.create({
      data: {
        companyId,
        number,
        type,
        estado: estado || 'BORRADOR',
        amount: Number(amount),
        date: new Date(date),
        journalId: journalId || null,
        contactId: contactId || null,
        projectId: projectId || null,
        description: description || null,
        concepto: concepto || null,
        budgetItemId: budgetItemId || null,
        propertyId: propertyId || null,
      },
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

    // Actualizar el contador
    if (isEntrada) {
      await prisma.company.update({
        where: { id: companyId },
        data: { paymentEntradaNextNumber: nextNumber + 1 },
      });
    } else {
      await prisma.company.update({
        where: { id: companyId },
        data: { paymentSalidaNextNumber: nextNumber + 1 },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
