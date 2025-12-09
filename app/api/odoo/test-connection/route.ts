import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';

// Función para autenticar en Odoo vía JSON-RPC
async function odooAuthenticate(url: string, port: string, db: string, username: string, password: string) {
  try {
    const response = await fetch(`${url}:${port}/jsonrpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'login',
          args: [db, username, password]
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result && typeof data.result === 'number') {
      return data.result;
    }
    
    throw new Error('Credenciales inválidas');
  } catch (error: any) {
    throw new Error(`Error de autenticación: ${error.message}`);
  }
}

// POST - Probar conexión con Odoo
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    let { odooUrl, odooDb, odooUsername, odooPassword, odooPort } = body;

    // Si no hay contraseña, obtenerla de la configuración guardada
    if (!odooPassword || odooPassword.trim() === '') {
      const { prisma } = await import('@/lib/prisma');
      const company = await prisma.company.findFirst({
        where: {
          userId: payload.userId,
          active: true,
        },
        select: {
          odooPassword: true,
        },
      });
      
      if (company?.odooPassword) {
        odooPassword = company.odooPassword;
      }
    }

    // Validar campos requeridos
    if (!odooUrl || !odooDb || !odooUsername || !odooPassword) {
      return NextResponse.json(
        { error: 'Faltan datos de configuración' },
        { status: 400 }
      );
    }

    // Probar la autenticación
    const uid = await odooAuthenticate(
      odooUrl,
      odooPort || '8069',
      odooDb,
      odooUsername,
      odooPassword
    );

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con Odoo',
      userId: uid,
    });
  } catch (error: any) {
    console.error('Error al probar conexión con Odoo:', error);
    return NextResponse.json(
      { error: error.message || 'Error al conectar con Odoo' },
      { status: 500 }
    );
  }
}
