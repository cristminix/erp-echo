import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID es requerido' },
        { status: 400 }
      );
    }

    const budgetItems = await prisma.budgetItem.findMany({
      where: {
        companyId,
        active: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    return NextResponse.json(budgetItems);
  } catch (error) {
    console.error('Error fetching budget items:', error);
    return NextResponse.json(
      { error: 'Error al cargar las partidas presupuestarias' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, userId, code, name } = body;

    if (!companyId || !userId || !code || !name) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el código ya existe
    const existing = await prisma.budgetItem.findFirst({
      where: {
        companyId,
        code,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una partida con este código' },
        { status: 400 }
      );
    }

    const budgetItem = await prisma.budgetItem.create({
      data: {
        companyId,
        userId,
        code,
        name,
      },
    });

    return NextResponse.json(budgetItem, { status: 201 });
  } catch (error) {
    console.error('Error creating budget item:', error);
    return NextResponse.json(
      { error: 'Error al crear la partida presupuestaria' },
      { status: 500 }
    );
  }
}
