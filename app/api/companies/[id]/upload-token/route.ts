import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getEffectiveUserId } from '@/lib/user-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[Upload Token] Generating token for company:', params.id);
    const payload = await verifyAuth(request);
    const companyId = params.id;
    const effectiveUserId = await getEffectiveUserId(payload.userId);
    console.log('[Upload Token] User verified:', payload.userId, 'Effective:', effectiveUserId);

    // Verificar que la empresa pertenece al usuario
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: effectiveUserId,
      },
    });

    if (!company) {
      console.log('[Upload Token] Company not found');
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Generar token único
    const uploadToken = 'ut_' + crypto.randomBytes(32).toString('hex');
    console.log('[Upload Token] Token generated:', uploadToken);

    // Actualizar empresa con el nuevo token
    console.log('[Upload Token] Updating company...');
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        uploadToken,
        uploadTokenEnabled: true,
      },
    });

    console.log('[Upload Token] Company updated successfully');

    return NextResponse.json({
      success: true,
      uploadToken: updatedCompany.uploadToken,
      uploadUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upload/${updatedCompany.uploadToken}`,
    });
  } catch (error: any) {
    console.error('Error generating upload token:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar token' },
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
    const companyId = params.id;
    const effectiveUserId = await getEffectiveUserId(payload.userId);

    // Verificar que la empresa pertenece al usuario
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: effectiveUserId,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      );
    }

    // Deshabilitar token
    await prisma.company.update({
      where: { id: companyId },
      data: {
        uploadTokenEnabled: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Token deshabilitado',
    });
  } catch (error: any) {
    console.error('Error disabling upload token:', error);
    return NextResponse.json(
      { error: error.message || 'Error al deshabilitar token' },
      { status: 500 }
    );
  }
}
