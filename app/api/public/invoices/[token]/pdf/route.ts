import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDFHTML } from '@/lib/invoice-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 400 }
      );
    }

    // Buscar la factura por el token público o por ID (fallback)
    let invoice = await prisma.invoice.findUnique({
      where: {
        publicToken: token,
      },
      include: {
        company: true,
        contact: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Si no se encuentra por token, intentar buscar por ID directamente
    if (!invoice) {
      invoice = await prisma.invoice.findUnique({
        where: {
          id: token,
        },
        include: {
          company: true,
          contact: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Generar HTML de la factura para mostrar al cliente
    console.log('📄 Redirigiendo a vista de impresión para factura:', invoice.number);
    const pdfHtml = generateInvoicePDFHTML(invoice, invoice.company, invoice.contact);

    // Devolver HTML con script para auto-imprimir
    return new NextResponse(pdfHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error en descarga pública de factura:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
