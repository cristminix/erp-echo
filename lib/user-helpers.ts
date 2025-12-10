import { prisma } from './prisma';

/**
 * Obtiene el ID del usuario "efectivo" para filtrar datos compartidos.
 * Si el usuario fue creado por otro usuario (tiene createdById), devuelve el ID del padre.
 * Si no, devuelve su propio ID.
 * 
 * Esto permite que usuarios creados desde el dashboard compartan datos con su creador.
 */
export async function getEffectiveUserId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdById: true },
  });

  // Si tiene padre (fue creado por otro usuario), usar el ID del padre
  if (user?.createdById) {
    return user.createdById;
  }

  // Si no, usar su propio ID
  return userId;
}

/**
 * Obtiene los IDs de usuarios que deben compartir datos.
 * Incluye al usuario principal y todos los usuarios que él creó.
 */
export async function getSharedUserIds(userId: string): Promise<string[]> {
  const effectiveUserId = await getEffectiveUserId(userId);
  
  // Obtener el usuario efectivo y todos los usuarios que él creó
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: effectiveUserId },
        { createdById: effectiveUserId },
      ],
    },
    select: { id: true },
  });

  return users.map(u => u.id);
}
