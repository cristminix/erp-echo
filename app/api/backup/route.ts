import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/jwt';

// Función para convertir BigInt y otros tipos problemáticos
function serializeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);

    if (!payload) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    console.log('Iniciando respaldo...');

    // Obtener TODOS los datos de todas las tablas
    const users = await prisma.user.findMany();
    console.log(`Usuarios: ${users.length}`);

    const companies = await prisma.company.findMany();
    console.log(`Empresas: ${companies.length}`);

    const contacts = await prisma.contact.findMany();
    console.log(`Contactos: ${contacts.length}`);

    const products = await prisma.product.findMany();
    console.log(`Productos: ${products.length}`);

    const invoices = await prisma.invoice.findMany();
    console.log(`Facturas: ${invoices.length}`);

    const invoiceItems = await prisma.invoiceItem.findMany();
    console.log(`Items de facturas: ${invoiceItems.length}`);

    let attendances: any[] = [];
    try {
      attendances = await prisma.attendance.findMany();
      console.log(`Asistencias: ${attendances.length}`);
    } catch (e) {
      console.log('Modelo Attendance no disponible');
    }

    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      data: {
        users: serializeData(users),
        companies: serializeData(companies),
        contacts: serializeData(contacts),
        products: serializeData(products),
        invoices: serializeData(invoices),
        invoiceItems: serializeData(invoiceItems),
        attendances: serializeData(attendances),
      },
    };

    console.log('Convirtiendo a JSON...');

    // Convertir a JSON (sin espacios para ahorrar espacio)
    const json = JSON.stringify(backup);
    const size = Buffer.byteLength(json, 'utf-8');

    console.log(`Tamaño del respaldo: ${size} bytes (${(size / 1024 / 1024).toFixed(2)} MB)`);

    // Guardar respaldo en la base de datos
    try {
      const savedBackup = await prisma.backup.create({
        data: {
          name: `Respaldo ${new Date().toLocaleString('es-ES')}`,
          data: json,
          size,
          createdBy: payload.userId,
        },
      });

      console.log('Respaldo creado exitosamente');

      return NextResponse.json(
        { 
          success: true, 
          message: 'Respaldo creado correctamente',
          backup: {
            id: savedBackup.id,
            name: savedBackup.name,
            size: savedBackup.size,
            createdAt: savedBackup.createdAt,
          }
        },
        { status: 200 }
      );
    } catch (dbError: any) {
      console.error('Error al guardar en BD:', dbError);
      
      // Si falla guardar en BD, ofrecer descarga directa
      const buffer = Buffer.from(json, 'utf-8');
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error al crear respaldo:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: `Error al crear respaldo: ${error.message}` },
      { status: 500 }
    );
  }
}
