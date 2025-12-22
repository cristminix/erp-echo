import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserId } from '@/lib/user-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await verifyAuth(request);
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const effectiveUserId = await getEffectiveUserId(payload.userId);
    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Fechas de inicio y fin son requeridas' },
        { status: 400 }
      );
    }

    // Verificar que el proyecto existe y obtener datos
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
        active: true,
      },
      include: {
        company: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Obtener todas las propiedades asociadas al proyecto con responsable
    const properties = await prisma.property.findMany({
      where: {
        projectId: params.id,
        active: true,
        responsableId: {
          not: null,
        },
      },
      include: {
        responsable: true,
      },
    });

    if (properties.length === 0) {
      return NextResponse.json(
        { error: 'No hay propiedades con responsable asociadas a este proyecto' },
        { status: 400 }
      );
    }

    // Buscar todas las líneas de factura con este proyecto en el rango de fechas
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        projectId: params.id,
        invoice: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
          status: 'VALIDATED',
        },
      },
      select: {
        total: true,
      },
    });

    // Sumar todos los importes
    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.total, 0);

    if (totalAmount === 0) {
      return NextResponse.json(
        { error: 'No hay facturas validadas en el rango de fechas seleccionado' },
        { status: 400 }
      );
    }

    // Dividir entre el número de propiedades
    const amountPerProperty = totalAmount / properties.length;

    // Obtener el siguiente número de pago de salida
    const company = await prisma.company.findUnique({
      where: { id: project.companyId },
      select: { paymentSalidaPrefix: true, paymentSalidaNextNumber: true },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Crear pagos en borrador para cada responsable
    const payments = [];
    let nextNumber = company.paymentSalidaNextNumber;

    for (const property of properties) {
      const paymentNumber = `${company.paymentSalidaPrefix}-${String(nextNumber).padStart(4, '0')}`;
      
      const payment = await prisma.payment.create({
        data: {
          companyId: project.companyId,
          number: paymentNumber,
          type: 'SALIDA',
          estado: 'BORRADOR',
          amount: amountPerProperty,
          currency: project.company.currency,
          contactId: property.responsableId!,
          projectId: params.id,
          propertyId: property.id,
          date: new Date(),
          description: `Distribución de costes del proyecto ${project.name} (${startDate} - ${endDate})`,
          concepto: `Distribución costes - Propiedad ${property.code}`,
        },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          property: {
            select: {
              id: true,
              code: true,
              address: true,
            },
          },
        },
      });

      payments.push(payment);
      nextNumber++;
    }

    // Actualizar el siguiente número de pago
    await prisma.company.update({
      where: { id: project.companyId },
      data: { paymentSalidaNextNumber: nextNumber },
    });

    return NextResponse.json({
      success: true,
      totalAmount,
      amountPerProperty,
      propertiesCount: properties.length,
      payments,
    });
  } catch (error) {
    console.error('Error al distribuir costes:', error);
    return NextResponse.json(
      { error: 'Error al distribuir costes' },
      { status: 500 }
    );
  }
}
