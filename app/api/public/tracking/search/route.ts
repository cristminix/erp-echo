import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('number');

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Número de seguimiento requerido' },
        { status: 400 }
      );
    }

    const tracking = await prisma.tracking.findFirst({
      where: {
        trackingNumber: trackingNumber.trim(),
      },
      select: {
        publicToken: true,
      },
    });

    if (!tracking || !tracking.publicToken) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ publicToken: tracking.publicToken });
  } catch (error) {
    console.error('Error al buscar seguimiento:', error);
    return NextResponse.json(
      { error: 'Error al buscar seguimiento' },
      { status: 500 }
    );
  }
}
