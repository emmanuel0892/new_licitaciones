"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export const getPAC = async (year, filters = {}) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const { page = 1, pageSize = 10, servicio, codigo, detalle } = filters

    const where = {
      anoPac: year
    }

    if (servicio) {
      where.servicio = { contains: servicio, mode: "insensitive" }
    }
    if (codigo) {
      where.codigo = { contains: codigo, mode: "insensitive" }
    }
    if (detalle) {
      where.detalle = { contains: detalle, mode: "insensitive" }
    }

    const [data, total] = await Promise.all([
      prisma.pAC.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: "asc" }
      }),
      prisma.pAC.count({ where })
    ])

    return { data, total }
  } catch (error) {
    return { error: "Error al obtener PAC" }
  }
}

export const getConsolidadoPAC = async (date, filters = {}) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const { page = 1, pageSize = 10, servicio, codigo } = filters
    const year = date.substring(0, 4)

    const where = {
      anoPac: year
    }

    if (servicio) {
      where.servicio = { contains: servicio, mode: "insensitive" }
    }
    if (codigo) {
      where.codigo = { contains: codigo, mode: "insensitive" }
    }

    const [data, total] = await Promise.all([
      prisma.pAC.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { servicio: "asc" }
      }),
      prisma.pAC.count({ where })
    ])

    return { data, total }
  } catch (error) {
    return { error: "Error al obtener consolidado" }
  }
}

export const uploadPAC = async (data) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  const userType = session.user.typeAccount
  if (userType !== "Super Admin" && userType !== "Secretaria Abastecimiento") {
    return { error: "No tiene permisos" }
  }

  try {
    await prisma.pAC.createMany({
      data: data.map(item => ({
        servicio: item.servicio || "",
        supraServicio: item.supraServicio || "",
        bodega: item.bodega || "",
        codigo: item.codigo || "",
        detalle: item.detalle || "",
        unidadMedida: item.unidadMedida || "",
        costoUnitario: parseFloat(item.costoUnitario) || 0,
        cantidadAnual: parseInt(item.cantidadAnual) || 0,
        enero: parseInt(item.enero) || 0,
        febrero: parseInt(item.febrero) || 0,
        marzo: parseInt(item.marzo) || 0,
        abril: parseInt(item.abril) || 0,
        mayo: parseInt(item.mayo) || 0,
        junio: parseInt(item.junio) || 0,
        julio: parseInt(item.julio) || 0,
        agosto: parseInt(item.agosto) || 0,
        septiembre: parseInt(item.septiembre) || 0,
        octubre: parseInt(item.octubre) || 0,
        noviembre: parseInt(item.noviembre) || 0,
        diciembre: parseInt(item.diciembre) || 0,
        mensual: parseFloat(item.mensual) || 0,
        anoPac: item.anoPac || new Date().getFullYear().toString()
      }))
    })

    revalidatePath("/dashboard/pac")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: "Error al cargar PAC" }
  }
}
