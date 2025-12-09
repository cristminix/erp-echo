import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let backup;

    // Verificar si es una restauración desde ID o desde datos
    if (body.backupId) {
      // Restaurar desde un respaldo guardado
      const savedBackup = await prisma.backup.findUnique({
        where: { id: body.backupId },
      });

      if (!savedBackup) {
        return NextResponse.json(
          { error: 'Respaldo no encontrado' },
          { status: 404 }
        );
      }

      backup = JSON.parse(savedBackup.data);
    } else {
      // Restaurar desde datos directos (archivo subido)
      backup = body;
    }

    // Validar estructura del respaldo
    if (!backup.version || !backup.data) {
      return NextResponse.json(
        { error: 'Formato de respaldo inválido' },
        { status: 400 }
      );
    }

    // ADVERTENCIA: Esto eliminará TODOS los datos actuales
    console.log('Eliminando todos los datos actuales...');

    // Eliminar en orden inverso de dependencias
    await prisma.invoiceItem.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.contact.deleteMany({});
    if (prisma.attendance) {
      await prisma.attendance.deleteMany({}).catch(() => {});
    }
    await prisma.company.deleteMany({});
    // No eliminamos usuarios para mantener la sesión actual

    console.log('Restaurando datos...');

    // Restaurar empresas
    for (const company of backup.data.companies || []) {
      await prisma.company.create({ data: company });
    }

    // Restaurar contactos
    for (const contact of backup.data.contacts || []) {
      await prisma.contact.create({ data: contact });
    }

    // Restaurar productos
    for (const product of backup.data.products || []) {
      await prisma.product.create({ data: product });
    }

    // Restaurar facturas
    for (const invoice of backup.data.invoices || []) {
      await prisma.invoice.create({ data: invoice });
    }

    // Restaurar items de facturas
    for (const item of backup.data.invoiceItems || []) {
      await prisma.invoiceItem.create({ data: item });
    }

    // Restaurar asistencias
    if (backup.data.attendances && prisma.attendance) {
      for (const attendance of backup.data.attendances) {
        await prisma.attendance.create({ data: attendance }).catch(() => {});
      }
    }

    return NextResponse.json(
      { success: true, message: 'Respaldo restaurado correctamente' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al restaurar respaldo:', error);
    return NextResponse.json(
      { error: `Error al restaurar respaldo: ${error.message}` },
      { status: 500 }
    );
  }
}
