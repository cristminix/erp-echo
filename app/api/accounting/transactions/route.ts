import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/accounting/transactions - Obtener todas las transacciones de una empresa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId es requerido' },
        { status: 400 }
      );
    }

    const transactions = await prisma.accountingTransaction.findMany({
      where: {
        companyId,
        active: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener transacciones' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/transactions - Crear una nueva transacción
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, userId, code, name, url } = body;

    if (!companyId || !userId || !code || !name || !url) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una transacción con ese código para esta empresa
    const existingTransaction = await prisma.accountingTransaction.findFirst({
      where: {
        companyId,
        code,
      },
    });

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'Ya existe una transacción con ese código' },
        { status: 400 }
      );
    }

    const transaction = await prisma.accountingTransaction.create({
      data: {
        companyId,
        userId,
        code,
        name,
        url,
      },
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error al crear transacción:', error);
    return NextResponse.json(
      { error: 'Error al crear transacción' },
      { status: 500 }
    );
  }
}
