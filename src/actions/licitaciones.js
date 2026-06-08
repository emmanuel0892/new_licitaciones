"use server"



import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createLicitacionSchema, devolverLicitacionSchema } from "@/lib/validations/licitacion"
import { esFormatoConvenioMarco, esFormatoLicitacion, esFormatoTratoDirecto, FLUJO_LICITACION, FLUJO_LICITACION_AVANCE, getInitialStepConvenioMarco, getMainStepNumero, getNextStep, getNextStepConvenioMarco, getNextStepTratoDirecto, getPreviousStepConvenioMarco, getPreviousStepTratoDirecto, getProcesoActualNumero, MAP_FLUJO_NUEVO_A_NUMERO_PASO_ANTIGUO, MAP_NUMERO_A_PROCESO_LICITACION } from "@/lib/helpers"
import { getUserPermissionContext, getWorkflowPermissionCode, PERMISSION_CODES, userHasPermission, userHasWorkflowPermission } from "@/lib/permissions"
import { getHistoryPermissionCode, getWorkflowViewPermissionCode } from "@/lib/permissionCodes"
import { assertCanAdvanceBySignature, canAdvanceBySignature, getRequiredSignaturesForStep, getSignatureStatusForStep, isSignatureBlocked } from "@/lib/signatures.js"

const signatureStatusSchema = z.object({
  licitacionId: z.coerce.number().int().positive()
})

const TIPO_DOCUMENTO_CERTIFICADO_TRATO_DIRECTO = "certificado_trato_directo"

const signLicitacionStepSchema = z.object({
  licitacionId: z.coerce.number().int().positive(),
  numeroPaso: z.coerce.number().int().positive(),
  firmaKey: z.string().trim().min(1),
  currentUserId: z.string().optional()
})

const licitacionIdSchema = z.coerce.number().int().positive()
const formatoLiquidacionIdSchema = z.coerce.number().int().positive()

const getFlujoPostPaso12Update = (targetStep) => {
  if (targetStep <= 16) {
    return {
      flujoPostPaso12: null,
      flujoPostPaso11: null,
      inicioAnticipado: false,
      requiereAddendum: false
    }
  }

  if (targetStep >= 17 && targetStep <= 24) {
    return {
      flujoPostPaso12: "inicio_anticipado",
      flujoPostPaso11: "inicio_anticipado",
      inicioAnticipado: true,
      requiereAddendum: false
    }
  }

  if (targetStep >= 25 && targetStep <= 35) {
    return {
      flujoPostPaso12: "contrato",
      flujoPostPaso11: "contrato",
      inicioAnticipado: false,
      requiereAddendum: false
    }
  }

  if (targetStep >= 36 && targetStep <= 46) {
    return {
      flujoPostPaso12: "contrato",
      flujoPostPaso11: "contrato",
      inicioAnticipado: false,
      requiereAddendum: true
    }
  }


  return {}

}



const getPasoAnteriorLicitacion = (currentStep) => {
  if (currentStep === 17 || currentStep === 25) return 16
  return currentStep - 1
}

const countCertificadosTratoDirecto = async (licitacionId) => {
  return prisma.documentoLicitacion.count({
    where: {
      licitacionId,
      tipoDocumento: TIPO_DOCUMENTO_CERTIFICADO_TRATO_DIRECTO
    }
  })
}

const getCertificateValidationForLicitacion = async (licitacion) => {
  const currentStep = Number(licitacion.procesoActual?.numeroPaso)

  if (!esFormatoTratoDirecto(licitacion) || currentStep !== 2) {
    return {
      canAdvance: true,
      count: 0,
      message: null
    }
  }

  const count = await countCertificadosTratoDirecto(licitacion.id)

  return {
    canAdvance: count > 0,
    count,
    message: count > 0 ? null : "Debe cargar al menos un certificado para avanzar."
  }
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



    const authorization = await getUserPermissionContext(session.user.id)

    const licitaciones = await prisma.licitacion.findMany({
      where,
      include: {
        usuario: { select: { name: true, lastname: true } },
        formatoLiquidacion: { select: { titulo: true } },
        procesoActual: { select: { tituloProceso: true, numeroPaso: true, roleId: true, diasSugeridos: true, role: { select: { name: true } } } },
        _count: { select: { documentos: true } }
      },
      orderBy: { createdAt: "desc" }
    })

    const signatureValidationByStepEntries = await Promise.all(
      licitaciones
        .map(async (licitacion) => {
          const numeroPaso = Number(licitacion.procesoActual?.numeroPaso)

          return [
            licitacion.id,
            await canAdvanceBySignature(licitacion.id, numeroPaso, licitacion)
          ]
        })
    )
    const signatureValidationByLicitacionId = Object.fromEntries(signatureValidationByStepEntries)
    const certificateValidationEntries = await Promise.all(
      licitaciones.map(async (licitacion) => {
        return [
          licitacion.id,
          await getCertificateValidationForLicitacion(licitacion)
        ]
      })
    )
    const certificateValidationByLicitacionId = Object.fromEntries(certificateValidationEntries)
    const licitacionesWithSignatureValidation = licitaciones.map((licitacion) => {
      return {
        ...licitacion,
        signatureValidation: signatureValidationByLicitacionId[licitacion.id] ?? {
          canAdvance: true,
          missing: [],
          required: []
        },
        certificateValidation: certificateValidationByLicitacionId[licitacion.id] ?? {
          canAdvance: true,
          count: 0,
          message: null
        }
      }
    })

    return {
      data: licitacionesWithSignatureValidation,
      currentUser: {
        isSuperAdmin: authorization.isSuperAdmin,
        permissions: authorization.permissions
      }
    }
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

        procesoActual: { select: { tituloProceso: true, numeroPaso: true, roleId: true, role: { select: { name: true } } } },

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



export const getLicitacionWorkflowById = async (id) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const parsedId = licitacionIdSchema.safeParse(id)

  if (!parsedId.success) {
    return { error: "Licitación inválida" }
  }

  const licitacion = await prisma.licitacion.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      formatoLiquidacion: {
        select: { titulo: true }
      }
    }
  })

  if (!licitacion) {
    return { error: "Licitación no encontrada" }
  }

  const allowed = await userHasPermission(
    session.user.id,
    getWorkflowViewPermissionCode(licitacion)
  )

  if (!allowed) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

  try {
    const workflowLicitacion = await prisma.licitacion.findUnique({
      where: { id: parsedId.data },
      include: {
        usuario: { select: { name: true, lastname: true } },
        formatoLiquidacion: {
          select: {
            titulo: true,
            cantidadPasos: true,
            procesos: {
              orderBy: { numeroPaso: "asc" }
            }
          }
        },
        procesoActual: true
      }
    })

    return { data: workflowLicitacion }
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
      select: {
        id: true,
        titulo: true,
        cantidadPasos: true
      },
      orderBy: { id: "asc" }
    })

    return {
      ok: true,
      data: formatos
    }

  } catch (error) {
    console.error("Error real al obtener formatos:", error)

    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}



export const createLicitacion = async (data) => {

  const session = await auth()

  

  if (!session) {

    return { error: "No autorizado" }

  }



  const allowed = await userHasPermission(session.user.id, PERMISSION_CODES.LICITACION_CREATE)

  if (!allowed) {

    return { error: "No tienes permisos para crear licitaciones." }

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

    const formatoLiquidacion = await prisma.formatoLiquidacion.findUnique({
      where: { id: parseInt(formatoLiquidacionId) },
      select: { titulo: true }
    })

    if (!formatoLiquidacion) {
      return { error: "No se encontro el formato de liquidacion" }
    }

    const numeroPasoInicial = esFormatoConvenioMarco(formatoLiquidacion)
      ? getInitialStepConvenioMarco(montoPresupuestado)
      : 1

    const primerProceso = await prisma.procesoLicitacion.findFirst({

      where: { formatoLiquidacionId: parseInt(formatoLiquidacionId), numeroPaso: numeroPasoInicial }

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

        usuario: {
  connect: {
    id: session.user.id
  }
},

        // Conectar el formato por relación
        formatoLiquidacion: {
          connect: {
            id: parseInt(formatoLiquidacionId)
          }
        },

        // Conectar el proceso actual (paso 1)
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



    const currentStep = Number(licitacion.procesoActual.numeroPaso)
    const formato = licitacion.formatoLiquidacion.titulo
    const canAdvance = await userHasWorkflowPermission(
      session.user.id,
      "avanzar",
      currentStep,
      formato
    )

    if (!canAdvance) {
      return { error: "No tienes permisos para avanzar este paso." }
    }

    if (esFormatoTratoDirecto(formato)) {
      const certificateValidation = await getCertificateValidationForLicitacion(licitacion)

      if (!certificateValidation.canAdvance) {
        return { error: certificateValidation.message }
      }

      await assertCanAdvanceBySignature(licitacion.id, currentStep, licitacion)

      const nextStep = getNextStepTratoDirecto(currentStep, licitacion)

      if (!nextStep) {
        await prisma.$transaction([
          prisma.licitacion.update({
            where: { id: parseInt(id) },
            data: { estado: "Finalizada" }
          }),
          prisma.historialLicitacion.create({
            data: {
              licitacionId: parseInt(id),
              usuarioId: session.user.id,
              tipoAccion: "finalizacion",
              procesoOrigen: licitacion.procesoActual.tituloProceso,
              procesoDestino: "Finalizada",
              observacion: "Proceso Trato Directo finalizado",
              requirente: licitacion.requirente
            }
          })
        ])

        revalidatePath("/dashboard/licitaciones")
        return { success: true, message: "Proceso Trato Directo finalizado" }
      }

      const procesoSiguiente = await prisma.procesoLicitacion.findFirst({
        where: {
          formatoLiquidacionId: licitacion.formatoLiquidacionId,
          numeroPaso: nextStep
        }
      })

      if (!procesoSiguiente) {
        return { error: "No se encontro el proceso siguiente de Trato Directo" }
      }

      await prisma.$transaction([
        prisma.licitacion.update({
          where: { id: parseInt(id) },
          data: {
            procesoActual: {
              connect: {
                id: procesoSiguiente.id
              }
            },
            fechaRecepcion: new Date(),
            estado: "Pendiente"
          }
        }),
        prisma.historialLicitacion.create({
          data: {
            licitacionId: parseInt(id),
            usuarioId: session.user.id,
            tipoAccion: "avance",
            procesoOrigen: licitacion.procesoActual.tituloProceso,
            procesoDestino: procesoSiguiente.tituloProceso,
            observacion: "Avance flujo Trato Directo",
            requirente: licitacion.requirente
          }
        })
      ])

      revalidatePath("/dashboard/licitaciones")
      return { success: true }
    }



    if (esFormatoConvenioMarco(licitacion)) {
      await assertCanAdvanceBySignature(licitacion.id, currentStep, licitacion)

      const nextStep = getNextStepConvenioMarco(currentStep, licitacion)

      if (!nextStep) {
        await prisma.$transaction([
          prisma.licitacion.update({
            where: { id: parseInt(id) },
            data: { estado: "Finalizada" }
          }),
          prisma.historialLicitacion.create({
            data: {
              licitacionId: parseInt(id),
              usuarioId: session.user.id,
              tipoAccion: "finalizacion",
              procesoOrigen: licitacion.procesoActual.tituloProceso,
              procesoDestino: "Finalizada",
              observacion: "Proceso Convenio Marco / Gran Compra finalizado",
              requirente: licitacion.requirente
            }
          })
        ])

        revalidatePath("/dashboard/licitaciones")
        return { success: true, message: "Proceso Convenio Marco / Gran Compra finalizado" }
      }

      const procesoSiguiente = await prisma.procesoLicitacion.findFirst({
        where: {
          formatoLiquidacionId: licitacion.formatoLiquidacionId,
          numeroPaso: nextStep
        }
      })

      if (!procesoSiguiente) {
        return { error: "No se encontro el proceso siguiente de Convenio Marco / Gran Compra" }
      }

      await prisma.$transaction([
        prisma.licitacion.update({
          where: { id: parseInt(id) },
          data: {
            procesoActual: {
              connect: {
                id: procesoSiguiente.id
              }
            },
            fechaRecepcion: new Date(),
            estado: "Pendiente"
          }
        }),
        prisma.historialLicitacion.create({
          data: {
            licitacionId: parseInt(id),
            usuarioId: session.user.id,
            tipoAccion: "avance",
            procesoOrigen: licitacion.procesoActual.tituloProceso,
            procesoDestino: procesoSiguiente.tituloProceso,
            observacion: "Avance flujo Convenio Marco / Gran Compra",
            requirente: licitacion.requirente
          }
        })
      ])

      revalidatePath("/dashboard/licitaciones")
      return { success: true }
    }

    // Si es formato Licitación, usar numeroPaso directamente de la BD
    if (esFormatoLicitacion(formato)) {
      console.log("=== AVANCE LICITACION DEBUG ===")
      console.log("currentStep:", currentStep)

      if (currentStep === 16) {
        return { showInicioAnticipadoModal: true }
      }

      if (currentStep === 35) {
        return { showAddendumModal: true }
      }

      await assertCanAdvanceBySignature(licitacion.id, currentStep)

      if (currentStep === 46) {
        await prisma.licitacion.update({
          where: { id: parseInt(id) },
          data: {
            estado: "Finalizada",
            requiereAddendum: true
          }
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

      const nextStep = getNextStep(currentStep)

      console.log("nextStep:", nextStep)

      if (!nextStep) {
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



      const isLastStep = nextStep === 24

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
          ...getFlujoPostPaso12Update(nextStep)
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
    return { error: error.message || "Error al avanzar la licitación" }
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



    const currentStep = Number(licitacion.procesoActual.numeroPaso)
    const formato = licitacion.formatoLiquidacion.titulo
    const canReturn = await userHasWorkflowPermission(
      session.user.id,
      "devolver",
      currentStep,
      formato
    )

    if (!canReturn) {
      return { error: "No tienes permisos para devolver este paso." }
    }

    if (esFormatoTratoDirecto(formato)) {
      const prevStep = getPreviousStepTratoDirecto(currentStep)

      if (!prevStep) {
        return { error: "No se puede devolver, esta en el primer proceso" }
      }

      const procesoAnterior = await prisma.procesoLicitacion.findFirst({
        where: {
          formatoLiquidacionId: licitacion.formatoLiquidacionId,
          numeroPaso: prevStep
        }
      })

      if (!procesoAnterior) {
        return { error: "No se encontro el proceso anterior de Trato Directo" }
      }

      await prisma.$transaction([
        prisma.licitacion.update({
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
        }),
        prisma.historialLicitacion.create({
          data: {
            licitacionId,
            usuarioId: session.user.id,
            tipoAccion: "devolucion",
            procesoOrigen: licitacion.procesoActual.tituloProceso,
            procesoDestino: procesoAnterior.tituloProceso,
            observacion,
            requirente: licitacion.requirente,
            createdAt: new Date()
          }
        })
      ])

      revalidatePath("/dashboard/licitaciones")
      return { success: true }
    }

    if (esFormatoConvenioMarco(licitacion)) {
      const prevStep = getPreviousStepConvenioMarco(currentStep, licitacion)

      if (!prevStep) {
        return { error: "No se puede devolver, esta en el primer proceso" }
      }

      const procesoAnterior = await prisma.procesoLicitacion.findFirst({
        where: {
          formatoLiquidacionId: licitacion.formatoLiquidacionId,
          numeroPaso: prevStep
        }
      })

      if (!procesoAnterior) {
        return { error: "No se encontro el proceso anterior de Convenio Marco / Gran Compra" }
      }

      await prisma.$transaction([
        prisma.licitacion.update({
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
        }),
        prisma.historialLicitacion.create({
          data: {
            licitacionId,
            usuarioId: session.user.id,
            tipoAccion: "devolucion",
            procesoOrigen: licitacion.procesoActual.tituloProceso,
            procesoDestino: procesoAnterior.tituloProceso,
            observacion,
            requirente: licitacion.requirente,
            createdAt: new Date()
          }
        })
      ])

      revalidatePath("/dashboard/licitaciones")
      return { success: true }
    }



    if (esFormatoLicitacion(formato)) {

      const prevStep = getPasoAnteriorLicitacion(currentStep)
      const reiniciaFlujoPostPaso12 = prevStep <= 16
      const reiniciaAddendum = prevStep <= 35


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

          ...getFlujoPostPaso12Update(prevStep)
        }

      })



      await prisma.historialLicitacion.create({

        data: {

          licitacionId,

          usuarioId: session.user.id,

          tipoAccion: "devolucion",
          procesoOrigen: procesoActual.tituloProceso,
          procesoDestino: procesoAnterior.tituloProceso,
          observacion: [
            observacion,
            reiniciaFlujoPostPaso12 ? "Devolucion y reinicio de flujo posterior al paso 12" : null,
            reiniciaAddendum && currentStep >= 36 ? "Devolucion y reinicio de flujo Addendum" : null
          ].filter(Boolean).join("\n"),
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

  const parsedId = licitacionIdSchema.safeParse(id)

  if (!parsedId.success) {
    return { error: "Licitación inválida" }
  }

  const licitacion = await prisma.licitacion.findUnique({
    where: { id: parsedId.data },
    select: {
      id: true,
      formatoLiquidacion: {
        select: { titulo: true }
      }
    }
  })

  if (!licitacion) {
    return { error: "Licitación no encontrada" }
  }

  const allowed = await userHasPermission(
    session.user.id,
    getHistoryPermissionCode(licitacion)
  )

  if (!allowed) {
    return { error: "No tienes permisos para realizar esta acción." }
  }



  try {

    const historial = await prisma.historialLicitacion.findMany({

      where: { licitacionId: parsedId.data },

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

    const canAdvance = await userHasPermission(
      session.user.id,
      getWorkflowPermissionCode("avanzar", currentStep)
    )

    if (!canAdvance) {
      return { error: "No tienes permisos para avanzar este paso." }
    }



    if (currentStep !== 16) {
      return { error: "Solo se puede iniciar el flujo anticipado desde el paso 16" }
    }

    const nextStep = getNextStep(currentStep, "inicio_anticipado")


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
        flujoPostPaso12: "inicio_anticipado",
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

    const canAdvance = await userHasPermission(
      session.user.id,
      getWorkflowPermissionCode("avanzar", currentStep)
    )

    if (!canAdvance) {
      return { error: "No tienes permisos para avanzar este paso." }
    }

    console.log("currentStep:", currentStep)



    if (currentStep !== 16) {
      return { error: "Solo se puede iniciar el flujo de contrato desde el paso 16" }
    }

    const nextStep = getNextStep(currentStep, "contrato")
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
        flujoPostPaso12: "contrato",
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

export const avanzarLicitacionConAddendum = async (id) => {
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

    const canAdvance = await userHasPermission(
      session.user.id,
      getWorkflowPermissionCode("avanzar", currentStep)
    )

    if (!canAdvance) {
      return { error: "No tienes permisos para avanzar este paso." }
    }

    if (currentStep !== 35) {
      return { error: "Solo se puede iniciar Addendum desde el paso 35" }
    }

    const nextStep = getNextStep(currentStep, "addendum_si")

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
        inicioAnticipado: false,
        flujoPostPaso12: "contrato",
        flujoPostPaso11: "contrato",
        requiereAddendum: true
      }
    })

    await prisma.historialLicitacion.create({
      data: {
        licitacionId: parseInt(id),
        usuarioId: session.user.id,
        tipoAccion: "avance",
        procesoOrigen: procesoActual.tituloProceso,
        procesoDestino: procesoSiguiente.tituloProceso,
        requirente: licitacion.requirente,
        createdAt: new Date()
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error("Error en avanzarLicitacionConAddendum:", error)
    return { error: "Error al avanzar al flujo Addendum" }
  }
}

export const finalizarLicitacionSinAddendum = async (id) => {
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

    const canAdvance = await userHasPermission(
      session.user.id,
      getWorkflowPermissionCode("avanzar", currentStep)
    )

    if (!canAdvance) {
      return { error: "No tienes permisos para avanzar este paso." }
    }

    if (currentStep !== 35) {
      return { error: "Solo se puede finalizar sin Addendum desde el paso 35" }
    }

    await prisma.licitacion.update({
      where: { id: parseInt(id) },
      data: {
        estado: "Finalizada",
        requiereAddendum: false
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true, message: "Licitación finalizada" }
  } catch (error) {
    console.error("Error en finalizarLicitacionSinAddendum:", error)
    return { error: "Error al finalizar sin Addendum" }
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

    const canAdvance = await userHasPermission(
      session.user.id,
      getWorkflowPermissionCode("avanzar", currentStep)
    )

    if (!canAdvance) {
      return { error: "No tienes permisos para avanzar este paso." }
    }



    if (currentStep !== 16) {
      return { error: "Solo se puede finalizar sin inicio anticipado desde el paso 16" }
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
  try {
    const formatoLiquidacionId = Number(formatoId)

    if (!formatoLiquidacionId) {
      return {
        ok: false,
        error: "Formato no válido",
        data: []
      }
    }

    const procesos = await prisma.procesoLicitacion.findMany({

      where: {

        formatoLiquidacionId

      },

      select: {

        id: true,

        formatoLiquidacionId: true,

        tituloProceso: true,

        numeroPaso: true,

        diasSugeridos: true,

        createdAt: true,

        updatedAt: true

      },

      orderBy: {

        numeroPaso: "asc"

      }

    })



    return {
      ok: true,
      data: procesos
    }

  } catch (error) {

    console.error("Error al cargar procesos del formato:", error)

    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      data: []
    }

  }
}

export const getWorkflowProcessesByFormato = async (formatoId) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const parsedFormatoId = formatoLiquidacionIdSchema.safeParse(formatoId)

  if (!parsedFormatoId.success) {
    return { error: "Formato inválido" }
  }

  const formatoLiquidacion = await prisma.formatoLiquidacion.findUnique({
    where: { id: parsedFormatoId.data },
    select: { titulo: true }
  })

  if (!formatoLiquidacion) {
    return { error: "Formato no encontrado" }
  }

  const allowed = await userHasPermission(
    session.user.id,
    getWorkflowViewPermissionCode({ formatoLiquidacion })
  )

  if (!allowed) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

  return getProcesosByFormato(parsedFormatoId.data)
}

const getCurrentUserSignatureContext = async (userId) => {
  const authorization = await getUserPermissionContext(userId)
  const currentUser = authorization.user

  if (!currentUser) {
    return null
  }

  const normalizeFirmaBase64 = (firma) => {
    if (!firma) return null
    if (firma.startsWith("data:image/")) {
      return firma
    }
    return `data:image/png;base64,${firma}`
  }

  return {
    user: currentUser,
    isSuperAdmin: authorization.isSuperAdmin,
    permissions: authorization.permissions,
    hasStoredSignature: Boolean(currentUser.firma && currentUser.firma.trim() !== ""),
    firma: normalizeFirmaBase64(currentUser.firma)
  }
}

const buildSignatureActionStatus = (signatureStatus, userContext) => {
  return signatureStatus.map((signature) => {
    if (signature.status === "firmada") {
      return {
        ...signature,
        canSign: false,
        actionMessage: "Firma registrada"
      }
    }

    if (isSignatureBlocked(signature, signatureStatus)) {
      const dependency = signatureStatus.find((item) => item.key === signature.dependsOn)

      return {
        ...signature,
        status: "bloqueada",
        canSign: false,
        actionMessage: `Primero debe firmar ${dependency?.label ?? "la firma anterior"}.`
      }
    }

    if (!userContext.hasStoredSignature) {
      return {
        ...signature,
        canSign: false,
        actionMessage: "Debe subir su firma antes de firmar."
      }
    }

    if (!userContext.isSuperAdmin && !userContext.permissions.includes(signature.permissionCode)) {
      return {
        ...signature,
        canSign: false,
        actionMessage: `No tienes permisos para firmar como ${signature.label}.`
      }
    }

    return {
      ...signature,
      canSign: true,
      actionMessage: null
    }
  })
}

export const getLicitacionSignatureStatus = async (data) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const validatedFields = signatureStatusSchema.safeParse(data)

  if (!validatedFields.success) {
    return { error: "Datos inválidos" }
  }

  const { licitacionId } = validatedFields.data

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: licitacionId },
      include: {
        procesoActual: true,
        formatoLiquidacion: true
      }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    if (!esFormatoLicitacion(licitacion.formatoLiquidacion.titulo) && !esFormatoTratoDirecto(licitacion) && !esFormatoConvenioMarco(licitacion)) {
      return { error: "Esta función solo es para licitaciones" }
    }

    const numeroPaso = Number(licitacion.procesoActual.numeroPaso)
    const userContext = await getCurrentUserSignatureContext(session.user.id)

    if (!userContext) {
      return { error: "Usuario no encontrado." }
    }

    const signatureStatus = await getSignatureStatusForStep(licitacion.id, numeroPaso, licitacion)

    return {
      data: {
        licitacion: {
          id: licitacion.id,
          nombreLicitacion: licitacion.nombreLicitacion,
          numeroLicitacion: licitacion.numeroLicitacion,
          numeroPaso,
          procesoActual: licitacion.procesoActual.tituloProceso
        },
        currentUser: {
          id: userContext.user.id,
          hasStoredSignature: userContext.hasStoredSignature,
          firma: userContext.firma,
          isSuperAdmin: userContext.isSuperAdmin
        },
        signatures: buildSignatureActionStatus(signatureStatus, userContext)
      }
    }
  } catch (error) {
    console.error("Error en getLicitacionSignatureStatus:", error)
    return { error: "Error al obtener estado de firmas" }
  }
}

export const signLicitacionStep = async (data) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const validatedFields = signLicitacionStepSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { licitacionId, numeroPaso, firmaKey, currentUserId } = validatedFields.data

  if (currentUserId && currentUserId !== session.user.id) {
    return { error: "No autorizado para firmar con otro usuario." }
  }

  try {
    const licitacion = await prisma.licitacion.findUnique({
      where: { id: licitacionId },
      include: {
        procesoActual: true,
        formatoLiquidacion: true
      }
    })

    if (!licitacion) {
      return { error: "Licitación no encontrada" }
    }

    if (!esFormatoLicitacion(licitacion.formatoLiquidacion.titulo) && !esFormatoTratoDirecto(licitacion) && !esFormatoConvenioMarco(licitacion)) {
      return { error: "Esta función solo es para licitaciones" }
    }

    const currentStep = Number(licitacion.procesoActual.numeroPaso)

    if (currentStep !== Number(numeroPaso)) {
      return { error: "Esta firma no corresponde al paso actual." }
    }

    const required = getRequiredSignaturesForStep(licitacion, currentStep)
    const requirement = required.find((item) => item.key === firmaKey)

    if (!requirement) {
      return { error: "Esta firma no corresponde al paso actual." }
    }

    const userContext = await getCurrentUserSignatureContext(session.user.id)

    if (!userContext) {
      return { error: "Usuario no encontrado." }
    }

    if (!userContext.hasStoredSignature) {
      return { error: "Debe subir su firma antes de firmar." }
    }

    if (!userContext.isSuperAdmin && !userContext.permissions.includes(requirement.permissionCode)) {
      return { error: `No tienes permisos para firmar como ${requirement.label}.` }
    }

    const appliedSignatures = await prisma.licitacion_firmas.findMany({
      where: {
        licitacion_id: licitacionId,
        numero_paso: currentStep
      }
    })

    const alreadySigned = appliedSignatures.some(
      (signature) => signature.firma_key === requirement.key
    )

    if (alreadySigned) {
      return { error: "Esta firma ya fue registrada." }
    }

    if (requirement.dependsOn) {
      const dependencySigned = appliedSignatures.some(
        (signature) => signature.firma_key === requirement.dependsOn
      )

      if (!dependencySigned) {
        const dependency = required.find((item) => item.key === requirement.dependsOn)
        return { error: `Primero debe firmar ${dependency?.label ?? "la firma anterior"}.` }
      }
    }

    await prisma.licitacion_firmas.create({
      data: {
        licitacion_id: licitacionId,
        numero_paso: currentStep,
        firma_key: requirement.key,
        firma_label: requirement.label,
        user_id: userContext.user.id,
        created_at: new Date()
      }
    })

    revalidatePath("/dashboard/licitaciones")
    return { success: true }
  } catch (error) {
    console.error("Error en signLicitacionStep:", error)
    return { error: error.message || "Error al firmar" }
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

