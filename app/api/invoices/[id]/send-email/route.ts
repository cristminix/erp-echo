import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { sendEmail, generateInvoiceEmailTemplate } from '@/lib/email';
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

    // Obtener la factura con todos sus datos
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: effectiveUserId,
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

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el contacto tenga email
    if (!invoice.contact?.email) {
      return NextResponse.json(
        { error: 'El contacto no tiene un correo electrónico configurado' },
        { status: 400 }
      );
    }

    // Verificar que la empresa tenga configuración SMTP
    if (!invoice.company.smtpHost || !invoice.company.smtpUser || !invoice.company.smtpPassword) {
      return NextResponse.json(
        { error: 'La empresa no tiene configuración SMTP. Por favor configure el SMTP en la configuración de la empresa.' },
        { status: 400 }
      );
    }

    // Generar token público si no existe
    let publicToken = invoice.publicToken;
    if (!publicToken) {
      publicToken = `${invoice.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      try {
        const updatedInvoice = await prisma.invoice.update({
          where: { id: invoice.id },
          data: { publicToken: publicToken },
        });
        console.log('🔑 Token público generado:', publicToken);
      } catch (updateError) {
        console.error('Error actualizando token:', updateError);
        // Si falla, usamos el invoice.id como token temporal
        publicToken = invoice.id;
      }
    }

    // Construir URL pública de descarga
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const downloadUrl = `${baseUrl}/api/public/invoices/${publicToken}/pdf`;

    // Generar el HTML del correo con el enlace de descarga
    const emailHtml = generateInvoiceEmailTemplate(invoice, invoice.company, invoice.contact, downloadUrl);

    // Enviar el correo (sin adjuntos, solo con enlace de descarga)
    await sendEmail({
      to: invoice.contact.email,
      subject: `Factura ${invoice.number} - ${invoice.company.name}`,
      html: emailHtml,
      companyId: invoice.company.id,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Factura enviada correctamente a ${invoice.contact.email}`,
      downloadUrl 
    });
  } catch (error: any) {
    console.error('Error al enviar factura por correo:', error);
    
    // Mensajes de error más específicos
    if (error.message?.includes('SMTP')) {
      return NextResponse.json(
        { error: 'Error de configuración SMTP: ' + error.message },
        { status: 500 }
      );
    }
    
    if (error.code === 'EAUTH') {
      return NextResponse.json(
        { error: 'Error de autenticación SMTP. Verifique el usuario y contraseña en la configuración de la empresa.' },
        { status: 500 }
      );
    }
    
    if (error.code === 'ECONNECTION') {
      return NextResponse.json(
        { error: 'No se pudo conectar al servidor SMTP. Verifique el host y puerto en la configuración de la empresa.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Error al enviar correo: ' + error.message },
      { status: 500 }
    );
  }
}
