"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { createLicitacionSchema, devolverLicitacionSchema } from "@/lib/validations/licitacion"
import { esFormatoLicitacion, FLUJO_LICITACION, FLUJO_LICITACION_AVANCE, getMainStepNumero, getProcesoActualNumero, MAP_FLUJO_NUEVO_A_NUMERO_PASO_ANTIGUO, MAP_NUMERO_A_PROCESO_LICITACION } from "@/lib/helpers"

const getFlujoPostPaso11Update = (targetStep) => {
  if (targetStep <= 15) {
    return {
      flujoPostPaso11: null,
      inicioAnticipado: false
    }
  }

  if (targetStep >= 16 && targetStep <= 23) {
    return {
      flujoPostPaso11: "inicio_anticipado",
      inicioAnticipado: true
    }
  }

  if (targetStep >= 24 && targetStep <= 34) {
    return {
      flujoPostPaso11: "contrato",
      inicioAnticipado: false
    }
  }

  return {}
}

const getPasoAnteriorLicitacion = (currentStep) => {
  if (currentStep === 16 || currentStep === 24) return 15
  return currentStep - 1
}

export const getLicitaciones = async (filters = {}) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const { numeroLicitacion, usuarioId, estado, roleId } = filters
  const userType = session.user.typeAccount

  try {
    const where = {}
    const andConditions = []

    if (numeroLicitacion) {
      andConditions.push({
        OR: [
          { numeroLicitacion: { contains: numeroLicitacion } },
          { nombreLicitacion: { contains: numeroLicitacion } }
        ]
      })
    }

    if (usuarioId) {
      andConditions.push({ usuarioId: parseInt(usuarioId) })
    }

    if (estado) {
      andConditions.push({ estado })
    }

    if (roleId) {
      andConditions.push({ procesoActual: { roleId } })
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    const licitaciones = await prisma.licitacion.findMany({
      where,
      include: {
        usuario: { select: { name: true, lastname: true } },
        formatoLiquidacion: { select: { titulo: true } },
        procesoActual: { select: { tituloProceso: true, roleId: true, diasSugeridos: true, role: { select: { name: true } } } },
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
        procesoActual: { select: { tituloProceso: true, roleId: true, role: { select: { name: true } } } },
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
      include: { 
        procesos: { 
          orderBy: { numeroPaso: "asc" },
          include: {
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        } 
      },
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

  const { formatoLiquidacionId, requirente, productoServicio, numeroLicitacion, vigencia, nombreLicitacion, montoPresupuestado } = validatedFields.data

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
        procesoActual: {
          connect: {
            id: primerProceso.id
          }
        },
        requirente,
        productoServicio,
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

    const formato = licitacion.formatoLiquidacion.titulo

    // Si es formato Licitación, usar numeroPaso directamente de la BD
    if (esFormatoLicitacion(formato)) {
      const currentStep = Number(licitacion.procesoActual.numeroPaso)
      const nextStep = currentStep + 1

      console.log("=== AVANCE LICITACION DEBUG ===")
      console.log("currentStep:", currentStep)
      console.log("nextStep:", nextStep)

      // Si está en el paso 15, mostrar modal de inicio anticipado
      if (currentStep === 15) {
        return { showInicioAnticipadoModal: true }
      }

      // Si está en el paso 23, es el último paso
      if (currentStep === 23 || currentStep === 34) {
        return { error: "La licitación ya se encuentra en el último paso del flujo." }
      }

      const procesoActual = await prisma.procesoLicitacion.findFirst({
        where: {
          formatoLiquidacionId: licitacion.formatoLiquidacionId,
          numeroPaso: currentStep
        }
      })

      const procesoSiguiente = await prisma.procesoLicitacion.findFirst({
        where: {
          formatoLiquidacionId: licitacion.formatoLiquidacionId,
          numeroPaso: nextStep
        }
      })

      if (!procesoActual || !procesoSiguiente) {
        return { error: "No se encontraron los procesos necesarios" }
      }

      const isLastStep = nextStep === 23 || nextStep === 34

      await prisma.licitacion.update({
        where: { id: parseInt(id) },
        data: {
          procesoActual: {
            connect: {
              id: procesoSiguiente.id
            }
          },
          fechaRecepcion: new Date(),
          estado: isLastStep ? "Finalizada" : "Pendiente",
          ...getFlujoPostPaso11Update(nextStep)
        }
      })

      await prisma.historialLicitacion.create({
        data: {
          licitacionId: parseInt(id),
          usuarioId: session.user.id,
          tipoAccion: "avance",
          procesoOrigen: procesoActual.tituloProceso,
          procesoDestino: procesoSiguiente.tituloProceso,
          requirente: licitacion.requirente
        }
      })

      revalidatePath("/dashboard/licitaciones")
      return { success: true }
    }

    // Para otros formatos, usar la lógica original
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
          procesoDestino: "Finalizada",
          requirente: licitacion.requirente
        }
      })

      revalidatePath("/dashboard/licitaciones")
      return { success: true, message: "Licitación finalizada" }
    }

    const siguienteProceso = procesos[procesoActualIndex + 1]

    await prisma.licitacion.update({
      where: { id: parseInt(id) },
      data: {
        procesoActual: {
          connect: {
            id: siguienteProceso.id
          }
        },
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
        procesoDestino: siguienteProceso.tituloProceso,
        requirente: licitacion.requirente
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
        formatoLiquidacion: true,
        procesoActual: true
      }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    const formato = licitacion.formatoLiquidacion.titulo

    if (esFormatoLicitacion(formato)) {
      const currentStep = Number(licitacion.procesoActual.numeroPaso)
      const prevStep = getPasoAnteriorLicitacion(currentStep)
      const reiniciaFlujoPostPaso11 = prevStep <= 15

      if (currentStep <= 1) {
        return { error: "No se puede devolver, está en el primer proceso" }
      }

      const procesoActual = await prisma.procesoLicitacion.findFirst({
        where: {
          formatoLiquidacionId: licitacion.formatoLiquidacionId,
          numeroPaso: currentStep
        }
      })

      const procesoAnterior = await prisma.procesoLicitacion.findFirst({
        where: {
          formatoLiquidacionId: licitacion.formatoLiquidacionId,
          numeroPaso: prevStep
        }
      })

      if (!procesoActual || !procesoAnterior) {
        return { error: "No se encontraron los procesos necesarios" }
      }

      await prisma.licitacion.update({
        where: { id: licitacionId },
        data: {
          procesoActual: {
            connect: {
              id: procesoAnterior.id
            }
          },
          fechaRecepcion: new Date(),
          estado: "Pendiente",
          ...getFlujoPostPaso11Update(prevStep)
        }
      })

      await prisma.historialLicitacion.create({
        data: {
          licitacionId,
          usuarioId: session.user.id,
          tipoAccion: "devolucion",
          procesoOrigen: procesoActual.tituloProceso,
          procesoDestino: procesoAnterior.tituloProceso,
          observacion: reiniciaFlujoPostPaso11
            ? `${observacion}\nDevolucion y reinicio de flujo posterior al paso 11`
            : observacion,
          requirente: licitacion.requirente,
          createdAt: new Date()
        }
      })

      revalidatePath("/dashboard/licitaciones")
      return { success: true }
    }

    // Para otros formatos, usar la lógica original
    const procesos = licitacion.formatoLiquidacion.procesos
    const procesoActualIndex = procesos.findIndex(p => p.id === licitacion.procesoActualId)
    
    if (procesoActualIndex === 0) {
      return { error: "No se puede devolver, está en el primer proceso" }
    }

    const procesoAnterior = procesos[procesoActualIndex - 1]

    await prisma.licitacion.update({
      where: { id: licitacionId },
      data: {
        procesoActual: {
          connect: {
            id: procesoAnterior.id
          }
        },
        fechaRecepcion: new Date(),
        estado: "Pendiente"
      }
    })

    await prisma.historialLicitacion.create({
      data: {
        licitacionId,
        usuarioId: session.user.id,
        tipoAccion: "devolucion",
        procesoOrigen: licitacion.procesoActual.tituloProceso,
        procesoDestino: procesoAnterior.tituloProceso,
        observacion,
        requirente: licitacion.requirente
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
        vigencia: vigencia ? (() => {
          const [year, month, day] = vigencia.split('-').map(Number)
          return new Date(year, month - 1, day, 12, 0, 0, 0)
        })() : null,
        contadorEdiciones: { increment: 1 }
      }
    })

    const cambios = []
    if (numeroLicitacion !== licitacion.numeroLicitacion) {
      cambios.push({
        campoModificado: "Número Licitación",
        datoAntiguo: licitacion.numeroLicitacion || "Sin número",
        datoNuevo: numeroLicitacion || "Sin número"
      })
    }
    if (nombreLicitacion !== licitacion.nombreLicitacion) {
      cambios.push({
        campoModificado: "Nombre Licitación",
        datoAntiguo: licitacion.nombreLicitacion,
        datoNuevo: nombreLicitacion
      })
    }
    if (requirente !== licitacion.requirente) {
      cambios.push({
        campoModificado: "Requirente",
        datoAntiguo: licitacion.requirente,
        datoNuevo: requirente
      })
    }
    if (montoPresupuestado !== licitacion.montoPresupuestado) {
      cambios.push({
        campoModificado: "Monto Presupuestado",
        datoAntiguo: licitacion.montoPresupuestado || "Sin monto",
        datoNuevo: montoPresupuestado || "Sin monto"
      })
    }

    for (const cambio of cambios) {
      await prisma.historialLicitacion.create({
        data: {
          licitacionId: parseInt(id),
          usuarioId: session.user.id,
          tipoAccion: "edicion",
          procesoOrigen: "Edición de datos",
          procesoDestino: "Edición de datos",
          observacion: `${cambio.campoModificado}: ${cambio.datoAntiguo} → ${cambio.datoNuevo}`
        }
      })
    }

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error("Error en updateLicitacion:", error)
    return { error: error.message || "Error al actualizar la licitación" }
  }
}

// Función para migrar licitaciones en paso 11 a estado Finalizada
export const migrarLicitacionesPaso11AFinalizada = async () => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (session.user.typeAccount !== "Super Admin") {
    return { error: "Solo Super Admin puede ejecutar esta migración" }
  }

  try {
    // Buscar licitaciones en formato Licitación que estén en paso 11 y con estado Pendiente
    const licitaciones = await prisma.licitacion.findMany({
      where: {
        estado: "Pendiente"
      },
      include: {
        formatoLiquidacion: {
          include: {
            procesos: true
          }
        },
        procesoActual: true
      }
    })

    let actualizadas = 0

    for (const licitacion of licitaciones) {
      const formato = licitacion.formatoLiquidacion.titulo
      
      // Solo procesar formato Licitación
      if (!esFormatoLicitacion(formato)) {
        continue
      }

      const currentTitulo = licitacion.procesoActual.tituloProceso
      const currentNumero = getProcesoActualNumero(currentTitulo)
      const currentMainNumero = getMainStepNumero(currentNumero)

      // Si está en paso 11, actualizar estado a Finalizada
      if (currentMainNumero === "11") {
        await prisma.licitacion.update({
          where: { id: licitacion.id },
          data: { estado: "Finalizada" }
        })
        actualizadas++
        console.log(`Licitación ${licitacion.nombreLicitacion} actualizada a Finalizada`)
      }
    }

    revalidatePath("/dashboard/licitaciones")
    return { success: true, message: `Se actualizaron ${actualizadas} licitaciones a estado Finalizada` }
  } catch (error) {
    console.error("Error en migrarLicitacionesPaso11AFinalizada:", error)
    return { error: error.message || "Error al migrar licitaciones" }
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

// Obtener estadísticas para el dashboard de crear licitación
export const getDashboardStats = async () => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Licitaciones activas (no finalizadas)
    const licitacionesActivas = await prisma.licitacion.count({
      where: { estado: { not: "Finalizada" } }
    })

    // Licitaciones próximas a vencer (vigencia en los próximos 30 días)
    const proximasVencer = await prisma.licitacion.count({
      where: {
        estado: { not: "Finalizada" },
        vigencia: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      }
    })

    // Presupuesto total del año (suma de montos presupuestados)
    const licitacionesAno = await prisma.licitacion.findMany({
      where: {
        createdAt: { gte: startOfYear }
      },
      select: { montoPresupuestado: true }
    })

    const presupuestoTotal = licitacionesAno.reduce((acc, lic) => {
      const monto = parseFloat(lic.montoPresupuestado) || 0
      return acc + monto
    }, 0)

    // Licitaciones finalizadas este año (comprometido/ejecutado)
    const licitacionesFinalizadas = await prisma.licitacion.findMany({
      where: {
        createdAt: { gte: startOfYear },
        estado: "Finalizada"
      },
      select: { montoPresupuestado: true }
    })

    const montoComprometido = licitacionesFinalizadas.reduce((acc, lic) => {
      const monto = parseFloat(lic.montoPresupuestado) || 0
      return acc + monto
    }, 0)

    // Consumo de licitaciones MP
    const licitacionesMP = await prisma.licitacionMP.findMany({
      select: {
        montoAdjudicado: true,
        montoConsumido: true,
        porcentajeConsumo: true
      }
    })

    const totalAdjudicadoMP = licitacionesMP.reduce((acc, l) => acc + (l.montoAdjudicado || 0), 0)
    const totalConsumidoMP = licitacionesMP.reduce((acc, l) => acc + (l.montoConsumido || 0), 0)
    const porcentajeConsumoMP = totalAdjudicadoMP > 0 
      ? (totalConsumidoMP / totalAdjudicadoMP) * 100 
      : 0

    // Alertas activas (licitaciones MP con consumo >= 50%)
    const alertasActivas = await prisma.licitacionMP.count({
      where: { porcentajeConsumo: { gte: 50 } }
    })

    return {
      data: {
        licitacionesActivas,
        proximasVencer,
        presupuestoTotal,
        montoComprometido,
        saldoDisponible: presupuestoTotal - montoComprometido,
        porcentajeEjecucion: presupuestoTotal > 0 
          ? (montoComprometido / presupuestoTotal) * 100 
          : 0,
        totalAdjudicadoMP,
        totalConsumidoMP,
        porcentajeConsumoMP,
        alertasActivas
      }
    }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener estadísticas" }
  }
}

// Buscar licitaciones similares por nombre
export const buscarLicitacionesSimilares = async (nombre, requirente) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!nombre || nombre.length < 3) {
    return { data: [] }
  }

  try {
    const palabras = nombre.toLowerCase().split(" ").filter(p => p.length > 3)
    
    if (palabras.length === 0) {
      return { data: [] }
    }

    // Buscar en licitaciones internas
    const licitacionesInternas = await prisma.licitacion.findMany({
      where: {
        OR: palabras.map(palabra => ({
          nombreLicitacion: { contains: palabra }
        }))
      },
      include: {
        formatoLiquidacion: { select: { titulo: true } },
        procesoActual: { select: { tituloProceso: true } }
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    })

    // Buscar en licitaciones de Mercado Público
    const licitacionesMP = await prisma.licitacionMP.findMany({
      where: {
        OR: [
          ...palabras.map(palabra => ({
            nombre: { contains: palabra }
          })),
          ...(requirente ? [{ requirente: { contains: requirente } }] : [])
        ]
      },
      include: {
        _count: { select: { ordenesCompra: true } }
      },
      take: 5,
      orderBy: { createdAt: "desc" }
    })

    return {
      data: {
        internas: licitacionesInternas,
        mercadoPublico: licitacionesMP
      }
    }
  } catch (error) {
    console.error(error)
    return { error: "Error al buscar licitaciones similares" }
  }
}

// Obtener licitaciones MP por requirente con alertas
export const getLicitacionesMPByRequirenteConAlerta = async (requirente) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!requirente) {
    return { data: [] }
  }

  try {
    const licitaciones = await prisma.licitacionMP.findMany({
      where: {
        requirente: { contains: requirente },
        porcentajeConsumo: { gte: 40 }
      },
      orderBy: { porcentajeConsumo: "desc" },
      take: 10
    })

    return { data: licitaciones }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener licitaciones" }
    
  }
}

export const avanzarLicitacionConInicioAnticipado = async (id) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        procesoActual: true,
        formatoLiquidacion: true
      }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    const formato = licitacion.formatoLiquidacion.titulo

    if (!esFormatoLicitacion(formato)) {
      return { error: "Esta función solo es para licitaciones" }
    }

    const currentStep = Number(licitacion.procesoActual.numeroPaso)

    if (currentStep !== 15) {
      return { error: "Solo se puede iniciar el flujo anticipado desde el paso 15" }
    }

    const nextStep = 16

    const procesoActual = await prisma.procesoLicitacion.findFirst({
      where: {
        formatoLiquidacionId: licitacion.formatoLiquidacionId,
        numeroPaso: currentStep
      }
    })

    const procesoSiguiente = await prisma.procesoLicitacion.findFirst({
      where: {
        formatoLiquidacionId: licitacion.formatoLiquidacionId,
        numeroPaso: nextStep
      }
    })

    if (!procesoActual || !procesoSiguiente) {
      return { error: "No se encontraron los procesos necesarios" }
    }

    await prisma.licitacion.update({
      where: { id: parseInt(id) },
      data: {
        procesoActual: {
          connect: {
            id: procesoSiguiente.id
          }
        },
        fechaRecepcion: new Date(),
        estado: "Pendiente",
        inicioAnticipado: true,
        flujoPostPaso11: "inicio_anticipado"
      }
    })

    await prisma.historialLicitacion.create({
      data: {
        licitacionId: parseInt(id),
        usuarioId: session.user.id,
        tipoAccion: "avance",
        procesoOrigen: procesoActual.tituloProceso,
        procesoDestino: procesoSiguiente.tituloProceso,
        requirente: licitacion.requirente
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al avanzar al flujo inicio anticipado" }
  }
}

export const avanzarLicitacionConContrato = async (id) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    console.log("=== AVANZAR LICITACION CONTRATO DEBUG ===")
    console.log("id:", id)

    const licitacion = await prisma.licitacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        procesoActual: true,
        formatoLiquidacion: true
      }
    })

    console.log("licitacion:", licitacion)

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    const formato = licitacion.formatoLiquidacion.titulo
    console.log("formato:", formato)

    if (!esFormatoLicitacion(formato)) {
      return { error: "Esta función solo es para licitaciones" }
    }

    const currentStep = Number(licitacion.procesoActual.numeroPaso)
    console.log("currentStep:", currentStep)

    if (currentStep !== 15) {
      return { error: "Solo se puede iniciar el flujo de contrato desde el paso 15" }
    }

    const nextStep = 24
    console.log("nextStep:", nextStep)

    const procesoActual = await prisma.procesoLicitacion.findFirst({
      where: {
        formatoLiquidacionId: licitacion.formatoLiquidacionId,
        numeroPaso: currentStep
      }
    })

    const procesoSiguiente = await prisma.procesoLicitacion.findFirst({
      where: {
        formatoLiquidacionId: licitacion.formatoLiquidacionId,
        numeroPaso: nextStep
      }
    })

    console.log("procesoActual:", procesoActual)
    console.log("procesoSiguiente:", procesoSiguiente)

    if (!procesoActual || !procesoSiguiente) {
      return { error: "No se encontraron los procesos necesarios" }
    }

    await prisma.licitacion.update({
      where: { id: parseInt(id) },
      data: {
        procesoActual: {
          connect: {
            id: procesoSiguiente.id
          }
        },
        fechaRecepcion: new Date(),
        estado: "Pendiente",
        inicioAnticipado: false,
        flujoPostPaso11: "contrato"
      }
    })

    await prisma.historialLicitacion.create({
      data: {
        licitacionId: parseInt(id),
        usuarioId: session.user.id,
        tipoAccion: "avance",
        procesoOrigen: procesoActual.tituloProceso,
        procesoDestino: procesoSiguiente.tituloProceso,
        requirente: licitacion.requirente
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error("Error en avanzarLicitacionConContrato:", error)
    return { error: "Error al avanzar al flujo de contrato" }
  }
}

export const finalizarLicitacionSinInicioAnticipado = async (id) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        procesoActual: true,
        formatoLiquidacion: true
      }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    const formato = licitacion.formatoLiquidacion.titulo

    if (!esFormatoLicitacion(formato)) {
      return { error: "Esta función solo es para licitaciones" }
    }

    const currentStep = Number(licitacion.procesoActual.numeroPaso)

    if (currentStep !== 15) {
      return { error: "Solo se puede finalizar sin inicio anticipado desde el paso 15" }
    }

    await prisma.licitacion.update({
      where: { id: parseInt(id) },
      data: {
        estado: "Finalizada",
        inicioAnticipado: false
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al finalizar la licitación" }
  }
}

export const deleteLicitacion = async (id) => {
  const session = await auth()

  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: parseInt(id) }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    // Eliminar documentos asociados primero
    await prisma.documentoLicitacion.deleteMany({
      where: { licitacionId: parseInt(id) }
    })

    // Eliminar historial asociado
    await prisma.historialLicitacion.deleteMany({
      where: { licitacionId: parseInt(id) }
    })

    // Eliminar la licitación
    await prisma.licitacion.delete({
      where: { id: parseInt(id) }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al eliminar la licitación" }
  }
}

// Obtener procesos por formato de liquidación desde la base de datos
export const getProcesosByFormato = async (formatoId) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const procesos = await prisma.procesoLicitacion.findMany({
      where: {
        formatoLiquidacionId: parseInt(formatoId)
      },
      include: {
        role: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        numeroPaso: "asc"
      }
    })

    return { data: procesos }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener procesos" }
  }
}

export const getRoles = async () => {
  try {
    const roles = await prisma.roles.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    })
    return { data: roles }
  } catch (error) {
    console.error(error)
    return { error: "Error al obtener roles" }
  }
}
