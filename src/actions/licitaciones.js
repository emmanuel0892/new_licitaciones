"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createLicitacionSchema, devolverLicitacionSchema } from "@/lib/validations/licitacion"

export const getLicitaciones = async (filters = {}) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  const { numeroLicitacion, usuarioId, estado, turno } = filters
  const userType = session.user.typeAccount

  try {
    const where = {}

    if (numeroLicitacion) {
      where.numeroLicitacion = { contains: numeroLicitacion, mode: "insensitive" }
    }

    if (usuarioId) {
      where.usuarioId = usuarioId
    }

    if (estado) {
      where.estado = estado
    }

    if (turno) {
      where.procesoActual = { turno }
    }

    const licitaciones = await prisma.licitacion.findMany({
      where,
      include: {
        usuario: { select: { name: true, lastname: true } },
        formatoLiquidacion: { select: { titulo: true } },
        procesoActual: { select: { tituloProceso: true, turno: true, diasSugeridos: true } },
        _count: { select: { documentos: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return { data: licitaciones }
  } catch (error) {
    return { error: "Error al obtener licitaciones" }
  }
}

export const getMisLicitaciones = async () => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const licitaciones = await prisma.licitacion.findMany({
      where: { usuarioId: session.user.id },
      include: {
        formatoLiquidacion: { select: { titulo: true } },
        procesoActual: { select: { tituloProceso: true, turno: true } },
        _count: { select: { documentos: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    return { data: licitaciones }
  } catch (error) {
    return { error: "Error al obtener licitaciones" }
  }
}

export const getLicitacionById = async (id) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: { select: { name: true, lastname: true } },
        formatoLiquidacion: { select: { titulo: true, cantidadPasos: true, procesos: true } },
        procesoActual: true,
        documentos: {
          include: { usuario: { select: { name: true, lastname: true } } }
        },
        historial: {
          include: { usuario: { select: { name: true, lastname: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    return { data: licitacion }
  } catch (error) {
    return { error: "Error al obtener la licitación" }
  }
}

export const getRequirentes = async () => {
  try {
    const requirentes = await prisma.requirente.findMany({
      orderBy: { nombre: "asc" }
    })

    return { data: requirentes }
  } catch (error) {
    return { error: "Error al obtener requirentes" }
  }
}

export const getFormatosLiquidacion = async () => {
  try {
    const formatos = await prisma.formatoLiquidacion.findMany({
      include: { procesos: { orderBy: { numeroPaso: "asc" } } },
      orderBy: { id: "asc" }
    })

    return { data: formatos }
  } catch (error) {
    return { error: "Error al obtener formatos" }
  }
}

export const createLicitacion = async (data) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  const userType = session.user.typeAccount
  if (userType !== "Super Admin" && userType !== "Licitador") {
    return { error: "No tiene permisos para crear licitaciones" }
  }

  const validatedFields = createLicitacionSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { formatoLiquidacionId, requirente, numeroLicitacion, vigencia, nombreLicitacion, montoPresupuestado } = validatedFields.data

  if (numeroLicitacion && numeroLicitacion !== "null") {
    const existingLicitacion = await prisma.licitacion.findFirst({
      where: { numeroLicitacion }
    })

    if (existingLicitacion) {
      return { error: "El número de licitación ya existe" }
    }
  }

  try {
    const primerProceso = await prisma.procesoLicitacion.findFirst({
      where: { formatoLiquidacionId: parseInt(formatoLiquidacionId), numeroPaso: 1 }
    })

    if (!primerProceso) {
      return { error: "No se encontró el proceso inicial" }
    }

    let requirenteRecord = await prisma.requirente.findUnique({
      where: { nombre: requirente }
    })

    if (!requirenteRecord) {
      requirenteRecord = await prisma.requirente.create({
        data: { nombre: requirente }
      })
    }

    await prisma.licitacion.create({
      data: {
        formatoLiquidacionId: parseInt(formatoLiquidacionId),
        usuarioId: session.user.id,
        procesoActualId: primerProceso.id,
        requirente,
        numeroLicitacion: numeroLicitacion === "null" ? null : numeroLicitacion,
        vigencia: vigencia && vigencia !== "null" ? new Date(vigencia) : null,
        nombreLicitacion,
        montoPresupuestado: montoPresupuestado === "null" ? null : montoPresupuestado,
        fechaRecepcion: new Date()
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al crear la licitación" }
  }
}

export const avanzarLicitacion = async (id) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        formatoLiquidacion: { include: { procesos: { orderBy: { numeroPaso: "asc" } } } },
        procesoActual: true
      }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    const procesos = licitacion.formatoLiquidacion.procesos
    const procesoActualIndex = procesos.findIndex(p => p.id === licitacion.procesoActualId)
    
    if (procesoActualIndex === procesos.length - 1) {
      await prisma.licitacion.update({
        where: { id: parseInt(id) },
        data: { estado: "Finalizada" }
      })

      await prisma.historialLicitacion.create({
        data: {
          licitacionId: parseInt(id),
          usuarioId: session.user.id,
          tipoAccion: "avance",
          procesoOrigen: licitacion.procesoActual.tituloProceso,
          procesoDestino: "Finalizada"
        }
      })

      revalidatePath("/dashboard/licitaciones")
      return { success: true, message: "Licitación finalizada" }
    }

    const siguienteProceso = procesos[procesoActualIndex + 1]

    await prisma.licitacion.update({
      where: { id: parseInt(id) },
      data: {
        procesoActualId: siguienteProceso.id,
        fechaRecepcion: new Date(),
        estado: "Pendiente"
      }
    })

    await prisma.historialLicitacion.create({
      data: {
        licitacionId: parseInt(id),
        usuarioId: session.user.id,
        tipoAccion: "avance",
        procesoOrigen: licitacion.procesoActual.tituloProceso,
        procesoDestino: siguienteProceso.tituloProceso
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al avanzar la licitación" }
  }
}

export const devolverLicitacion = async (data) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  const validatedFields = devolverLicitacionSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { licitacionId, observacion } = validatedFields.data

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: licitacionId },
      include: {
        formatoLiquidacion: { include: { procesos: { orderBy: { numeroPaso: "asc" } } } },
        procesoActual: true
      }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    const procesos = licitacion.formatoLiquidacion.procesos
    const procesoActualIndex = procesos.findIndex(p => p.id === licitacion.procesoActualId)

    if (procesoActualIndex === 0) {
      return { error: "No se puede devolver, está en el primer proceso" }
    }

    const procesoAnterior = procesos[procesoActualIndex - 1]

    await prisma.licitacion.update({
      where: { id: licitacionId },
      data: {
        procesoActualId: procesoAnterior.id,
        estado: "Devuelto",
        contadorDevoluciones: { increment: 1 },
        fechaRecepcion: new Date()
      }
    })

    await prisma.historialLicitacion.create({
      data: {
        licitacionId,
        usuarioId: session.user.id,
        tipoAccion: "devolucion",
        procesoOrigen: licitacion.procesoActual.tituloProceso,
        procesoDestino: procesoAnterior.tituloProceso,
        observacion
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al devolver la licitación" }
  }
}

export const updateLicitacion = async (data) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  const { id, numeroLicitacion, nombreLicitacion, requirente, montoPresupuestado, vigencia } = data

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: parseInt(id) }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    if (licitacion.usuarioId !== session.user.id && session.user.typeAccount !== "Super Admin") {
      return { error: "No tiene permisos para editar esta licitación" }
    }

    if (numeroLicitacion && numeroLicitacion !== licitacion.numeroLicitacion) {
      const existingLicitacion = await prisma.licitacion.findFirst({
        where: { 
          numeroLicitacion,
          id: { not: parseInt(id) }
        }
      })

      if (existingLicitacion) {
        return { error: "El número de licitación ya existe" }
      }
    }

    await prisma.licitacion.update({
      where: { id: parseInt(id) },
      data: {
        numeroLicitacion: numeroLicitacion || null,
        nombreLicitacion,
        requirente,
        montoPresupuestado: montoPresupuestado || null,
        vigencia: vigencia ? new Date(vigencia) : null,
        contadorEdiciones: { increment: 1 }
      }
    })

    await prisma.historialLicitacion.create({
      data: {
        licitacionId: parseInt(id),
        usuarioId: session.user.id,
        tipoAccion: "edicion",
        procesoOrigen: "Edición de datos",
        procesoDestino: "Edición de datos"
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al actualizar la licitación" }
  }
}

export const getHistorialLicitacion = async (id) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const historial = await prisma.historialLicitacion.findMany({
      where: { licitacionId: parseInt(id) },
      include: { usuario: { select: { name: true, lastname: true } } },
      orderBy: { createdAt: "desc" }
    })

    return { data: historial }
  } catch (error) {
    return { error: "Error al obtener el historial" }
  }
}
