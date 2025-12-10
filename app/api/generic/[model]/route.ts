import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Modelos permitidos para acceso genérico
const ALLOWED_MODELS = [
  'user',
  'company',
  'contact',
  'product',
  'invoice',
  'invoiceItem',
  'attendance',
];

// Middleware de autenticación - verifica el token contra la base de datos
async function authenticate(request: NextRequest): Promise<boolean> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return false;
  }
  
  // Buscar empresa con este token y que tenga la API habilitada
  const company = await prisma.company.findFirst({
    where: {
      apiKey: token,
      apiEnabled: true,
    },
  });
  
  return !!company;
}

// GET - Leer registros
export async function GET(
  request: NextRequest,
  { params }: { params: { model: string } }
) {
  try {
    // Verificar autenticación
    if (!authenticate(request)) {
      return NextResponse.json(
        { error: 'No autorizado. Token inválido.' },
        { status: 401 }
      );
    }

    const { model } = params;
    const modelLower = model.toLowerCase();

    // Verificar modelo permitido
    if (!ALLOWED_MODELS.includes(modelLower)) {
      return NextResponse.json(
        { error: `Modelo '${model}' no permitido` },
        { status: 400 }
      );
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const skip = searchParams.get('skip') ? parseInt(searchParams.get('skip')!) : undefined;
    
    // Construir filtros dinámicos
    const where: any = {};
    searchParams.forEach((value, key) => {
      if (!['id', 'limit', 'skip'].includes(key)) {
        where[key] = value;
      }
    });

    // @ts-ignore - Acceso dinámico a modelos de Prisma
    const prismaModel = prisma[modelLower];

    if (!prismaModel) {
      return NextResponse.json(
        { error: `Modelo '${model}' no encontrado` },
        { status: 404 }
      );
    }

    // Si se solicita un ID específico
    if (id) {
      const record = await prismaModel.findUnique({
        where: { id },
      });

      if (!record) {
        return NextResponse.json(
          { error: 'Registro no encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json(record);
    }

    // Listar registros con paginación y filtros
    const records = await prismaModel.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      take: limit,
      skip: skip,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prismaModel.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    });

    return NextResponse.json({
      data: records,
      total,
      limit,
      skip,
    });

  } catch (error) {
    console.error('Error en GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Crear registro
export async function POST(
  request: NextRequest,
  { params }: { params: { model: string } }
) {
  try {
    // Verificar autenticación
    const isAuthenticated = await authenticate(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado. Token inválido o API deshabilitada.' },
        { status: 401 }
      );
    }

    const { model } = params;
    const modelLower = model.toLowerCase();

    // Verificar modelo permitido
    if (!ALLOWED_MODELS.includes(modelLower)) {
      return NextResponse.json(
        { error: `Modelo '${model}' no permitido` },
        { status: 400 }
      );
    }

    const body = await request.json();

    // @ts-ignore
    const prismaModel = prisma[modelLower];

    if (!prismaModel) {
      return NextResponse.json(
        { error: `Modelo '${model}' no encontrado` },
        { status: 404 }
      );
    }

    const record = await prismaModel.create({
      data: body,
    });

    return NextResponse.json(record, { status: 201 });

  } catch (error) {
    console.error('Error en POST:', error);
    return NextResponse.json(
      { error: 'Error al crear registro', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar registro
export async function PUT(
  request: NextRequest,
  { params }: { params: { model: string } }
) {
  try {
    // Verificar autenticación
    const isAuthenticated = await authenticate(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado. Token inválido o API deshabilitada.' },
        { status: 401 }
      );
    }

    const { model } = params;
    const modelLower = model.toLowerCase();

    // Verificar modelo permitido
    if (!ALLOWED_MODELS.includes(modelLower)) {
      return NextResponse.json(
        { error: `Modelo '${model}' no permitido` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el campo "id" para actualizar' },
        { status: 400 }
      );
    }

    // @ts-ignore
    const prismaModel = prisma[modelLower];

    if (!prismaModel) {
      return NextResponse.json(
        { error: `Modelo '${model}' no encontrado` },
        { status: 404 }
      );
    }

    const record = await prismaModel.update({
      where: { id },
      data,
    });

    return NextResponse.json(record);

  } catch (error) {
    console.error('Error en PUT:', error);
    return NextResponse.json(
      { error: 'Error al actualizar registro', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar registro
export async function DELETE(
  request: NextRequest,
  { params }: { params: { model: string } }
) {
  try {
    // Verificar autenticación
    const isAuthenticated = await authenticate(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado. Token inválido o API deshabilitada.' },
        { status: 401 }
      );
    }

    const { model } = params;
    const modelLower = model.toLowerCase();

    // Verificar modelo permitido
    if (!ALLOWED_MODELS.includes(modelLower)) {
      return NextResponse.json(
        { error: `Modelo '${model}' no permitido` },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro "id" para eliminar' },
        { status: 400 }
      );
    }

    // @ts-ignore
    const prismaModel = prisma[modelLower];

    if (!prismaModel) {
      return NextResponse.json(
        { error: `Modelo '${model}' no encontrado` },
        { status: 404 }
      );
    }

    await prismaModel.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Registro eliminado exitosamente' });

  } catch (error) {
    console.error('Error en DELETE:', error);
    return NextResponse.json(
      { error: 'Error al eliminar registro', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
