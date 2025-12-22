import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Endpoint público para consultar facturas de venta de una empresa
// Requiere autenticación mediante API Key en el header X-API-Key
export async function GET(request: NextRequest) {
  try {
    // Obtener la API Key del header
    const apiKey = request.headers.get('X-API-Key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key requerida. Incluye el header X-API-Key en tu solicitud.' },
        { status: 401 }
      );
    }

    // Buscar la empresa con esta API Key
    const company = await prisma.company.findFirst({
      where: {
        apiKey,
        apiEnabled: true // Solo si la API está habilitada
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'API Key inválida o API no habilitada para esta empresa' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta opcionales
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Filtrar por estado
    const paymentStatus = searchParams.get('paymentStatus'); // Filtrar por estado de pago
    const startDate = searchParams.get('startDate'); // Filtrar desde fecha
    const endDate = searchParams.get('endDate'); // Filtrar hasta fecha
    const limit = parseInt(searchParams.get('limit') || '100'); // Límite de resultados (máx 100)
    const offset = parseInt(searchParams.get('offset') || '0'); // Offset para paginación

    // Construir filtros
    const where: any = {
      companyId: company.id,
      type: 'invoice_out' // Solo facturas de venta
    };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Consultar facturas con límite máximo de 100 registros
    const invoices = await prisma.invoice.findMany({
      where,
      take: Math.min(limit, 100),
      skip: offset,
      orderBy: {
        date: 'desc'
      },
      select: {
        // Cabecera de la factura
        id: true,
        number: true,
        date: true,
        dueDate: true,
        status: true,
        paymentStatus: true,
        currency: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        
        // Información del contacto
        contact: {
          select: {
            id: true,
            name: true,
            nif: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postalCode: true,
            country: true
          }
        },
        
        // Líneas de la factura
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            price: true,
            tax: true,
            product: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Calcular totales para cada factura
    const invoicesWithTotals = invoices.map(invoice => {
      let subtotal = 0;
      let totalTax = 0;
      
      invoice.items.forEach(item => {
        const itemSubtotal = item.quantity * item.price;
        const itemTax = itemSubtotal * (item.tax / 100);
        subtotal += itemSubtotal;
        totalTax += itemTax;
      });
      
      const total = subtotal + totalTax;
      
      return {
        ...invoice,
        subtotal: Math.round(subtotal * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        total: Math.round(total * 100) / 100
      };
    });

    // Obtener el total de registros para paginación
    const totalCount = await prisma.invoice.count({ where });

    return NextResponse.json({
      success: true,
      company: {
        id: company.id,
        name: company.name
      },
      pagination: {
        total: totalCount,
        limit: Math.min(limit, 100),
        offset,
        hasMore: offset + invoicesWithTotals.length < totalCount
      },
      invoices: invoicesWithTotals
    });

  } catch (error: any) {
    console.error('Error fetching invoices via API:', error);
    return NextResponse.json(
      { error: 'Error al obtener las facturas' },
      { status: 500 }
    );
  }
}
