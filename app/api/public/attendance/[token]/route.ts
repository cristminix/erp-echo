import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Obtener información del usuario y su asistencia de hoy
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    console.log('=== GET Attendance Info ===')
    console.log('Token:', token)

    // Buscar usuario por token
    const user = await prisma.user.findUnique({
      where: { attendanceToken: token },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        defaultCompanyId: true,
        defaultCompany: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            secondaryColor: true,
            logo: true
          }
        }
      }
    })

    console.log('User found:', user ? { id: user.id, hasAvatar: !!user.avatar } : null)

    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
    }

    // Verificar si el usuario tiene empresa asignada
    if (!user.defaultCompanyId) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
    }

    // Buscar asistencias del día de hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Obtener todos los registros del día
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        userId: user.id,
        companyId: user.defaultCompanyId,
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        checkIn: 'desc'
      }
    })

    // Buscar si hay un registro abierto (sin checkout)
    const openAttendance = todayAttendances.find(att => att.checkOut === null)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.avatar
      },
      company: user.defaultCompany,
      todayAttendance: openAttendance ? {
        id: openAttendance.id,
        checkIn: openAttendance.checkIn,
        checkOut: openAttendance.checkOut,
        notes: openAttendance.notes
      } : (todayAttendances.length > 0 ? {
        id: todayAttendances[0].id,
        checkIn: todayAttendances[0].checkIn,
        checkOut: todayAttendances[0].checkOut,
        notes: todayAttendances[0].notes
      } : null),
      allTodayAttendances: todayAttendances.map(att => ({
        id: att.id,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        notes: att.notes
      }))
    })
  } catch (error: any) {
    console.error('=== ERROR obteniendo información de asistencia ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error:', error)
    return NextResponse.json(
      { error: 'Error obteniendo información de asistencia' },
      { status: 500 }
    )
  }
}

// POST - Registrar entrada o salida
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const body = await req.json()
    let { action, notes, projectId, taskId } = body // action: 'check-in' | 'check-out'

    // Convertir strings vacíos a null
    projectId = projectId || null
    taskId = taskId || null

    console.log('=== POST Attendance Request ===')
    console.log('Token:', token)
    console.log('Body:', { action, notes, projectId, taskId })

    // Buscar usuario por token
    const user = await prisma.user.findUnique({
      where: { attendanceToken: token },
      select: {
        id: true,
        name: true,
        defaultCompanyId: true,
        hourlyRate: true
      }
    })

    console.log('User found:', user ? { id: user.id, name: user.name, hourlyRate: user.hourlyRate } : null)

    if (!user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 })
    }

    if (!user.defaultCompanyId) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 400 })
    }

    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (action === 'check-in') {
      // Buscar si hay un registro sin salida (abierto)
      const openAttendance = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          companyId: user.defaultCompanyId,
          date: {
            gte: today,
            lt: tomorrow
          },
          checkOut: null
        },
        orderBy: {
          checkIn: 'desc'
        }
      })

      if (openAttendance) {
        return NextResponse.json(
          { error: 'Debes registrar tu salida antes de hacer una nueva entrada' },
          { status: 400 }
        )
      }

      // Validar proyecto si se proporciona
      if (projectId) {
        console.log('Validating project:', projectId)
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            companyId: user.defaultCompanyId
          }
        })
        
        console.log('Project found:', project ? project.id : null)
        
        if (!project) {
          console.log('Project not valid - returning error')
          return NextResponse.json(
            { error: 'Proyecto no válido' },
            { status: 400 }
          )
        }

        // Validar tarea si se proporciona
        if (taskId) {
          console.log('Validating task:', taskId)
          const task = await prisma.task.findFirst({
            where: {
              id: taskId,
              projectId: projectId
            }
          })
          
          console.log('Task found:', task ? task.id : null)
          
          if (!task) {
            console.log('Task not valid - returning error')
            return NextResponse.json(
              { error: 'Tarea no válida' },
              { status: 400 }
            )
          }
        }
      }

      // Crear nuevo registro de entrada (permitir múltiples entradas en el día)
      console.log('Creating attendance with data:', {
        userId: user.id,
        companyId: user.defaultCompanyId,
        date: today,
        checkIn: now,
        hourlyRate: user.hourlyRate,
        notes: notes || null,
        projectId: projectId || null,
        taskId: taskId || null
      })

      const attendance = await prisma.attendance.create({
        data: {
          userId: user.id,
          companyId: user.defaultCompanyId,
          date: today,
          checkIn: now,
          hourlyRate: user.hourlyRate || null,
          notes: notes || null,
          projectId: projectId || null,
          taskId: taskId || null
        }
      })

      console.log('Attendance created successfully:', attendance.id)

      return NextResponse.json({
        message: 'Entrada registrada exitosamente',
        attendance: {
          id: attendance.id,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          notes: attendance.notes
        }
      })
    } else if (action === 'check-out') {
      // Buscar el último registro de entrada sin salida
      const attendance = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          companyId: user.defaultCompanyId,
          date: {
            gte: today,
            lt: tomorrow
          },
          checkOut: null
        },
        orderBy: {
          checkIn: 'desc'
        }
      })

      if (!attendance) {
        return NextResponse.json(
          { error: 'No existe un registro de entrada pendiente para hoy' },
          { status: 400 }
        )
      }

      // Actualizar con la hora de salida
      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: now,
          notes: notes ? `${attendance.notes || ''}\n${notes}`.trim() : attendance.notes
        }
      })

      return NextResponse.json({
        message: 'Salida registrada exitosamente',
        attendance: {
          id: updatedAttendance.id,
          checkIn: updatedAttendance.checkIn,
          checkOut: updatedAttendance.checkOut,
          notes: updatedAttendance.notes
        }
      })
    } else {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error registrando asistencia:', error)
    return NextResponse.json(
      { error: 'Error registrando asistencia' },
      { status: 500 }
    )
  }
}
