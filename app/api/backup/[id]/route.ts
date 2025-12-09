import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const backup = await prisma.backup.findUnique({
      where: { id: params.id },
    });

    if (!backup) {
      return NextResponse.json(
        { error: 'Respaldo no encontrado' },
        { status: 404 }
      );
    }

    // Devolver el archivo como descarga
    const buffer = Buffer.from(backup.data, 'utf-8');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${backup.name.replace(/[^a-z0-9]/gi, '_')}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Error al descargar respaldo:', error);
    return NextResponse.json(
      { error: `Error al descargar respaldo: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    await prisma.backup.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { success: true, message: 'Respaldo eliminado correctamente' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al eliminar respaldo:', error);
    return NextResponse.json(
      { error: `Error al eliminar respaldo: ${error.message}` },
      { status: 500 }
    );
  }
}
