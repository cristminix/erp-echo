import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

// GET - Obtener configuración de Odoo
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener empresa activa
    const company = await prisma.company.findFirst({
      where: {
        userId: payload.userId,
        active: true,
      },
      select: {
        odooUrl: true,
        odooDb: true,
        odooUsername: true,
        odooPassword: true,
        odooVersion: true,
        odooPort: true,
        odooEnabled: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'No hay empresa activa' }, { status: 404 });
    }

    // No devolver la contraseña, solo indicar si existe
    return NextResponse.json({
      odooUrl: company.odooUrl,
      odooDb: company.odooDb,
      odooUsername: company.odooUsername,
      odooVersion: company.odooVersion,
      odooPort: company.odooPort,
      odooEnabled: company.odooEnabled,
      hasPassword: !!(company.odooPassword && company.odooPassword.trim() !== ''),
    });
  } catch (error) {
    console.error('Error al obtener configuración Odoo:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// POST - Guardar configuración de Odoo
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { odooUrl, odooDb, odooUsername, odooPassword, odooVersion, odooPort, odooEnabled } = body;

    // Obtener empresa activa
    const company = await prisma.company.findFirst({
      where: {
        userId: payload.userId,
        active: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'No hay empresa activa' }, { status: 404 });
    }

    // Preparar datos para actualizar (solo actualizar contraseña si se proporciona)
    const updateData: any = {
      odooUrl: odooUrl || null,
      odooDb: odooDb || null,
      odooUsername: odooUsername || null,
      odooVersion: odooVersion || '17',
      odooPort: odooPort || '8069',
      odooEnabled: odooEnabled || false,
    };
    
    // Solo actualizar contraseña si se proporciona una nueva
    if (odooPassword && odooPassword.trim() !== '') {
      updateData.odooPassword = odooPassword;
    }

    // Actualizar configuración
    const updated = await prisma.company.update({
      where: { id: company.id },
      data: updateData,
    });
    
    console.log('✅ Configuración Odoo guardada:', {
      odooUrl: updated.odooUrl,
      odooDb: updated.odooDb,
      odooUsername: updated.odooUsername,
      hasPassword: !!updated.odooPassword,
      odooEnabled: updated.odooEnabled,
    });

    return NextResponse.json({ 
      message: 'Configuración guardada correctamente',
      odooEnabled: updated.odooEnabled 
    });
  } catch (error) {
    console.error('Error al guardar configuración Odoo:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}
