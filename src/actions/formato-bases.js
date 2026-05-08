"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { formatoBaseSchema } from "@/lib/validations/formato-base"

export const getFormatoBases = async () => {
  try {
    const bases = await prisma.formatoBase.findMany({
      orderBy: { createdAt: "desc" }
    })

    const medicamentos = bases.filter(b => b.tipoBase === "Medicamentos")
    const insumos = bases.filter(b => b.tipoBase === "Insumos")
    const servicios = bases.filter(b => b.tipoBase === "Servicios")
    const otros = bases.filter(b => b.tipoBase === "Otros Formatos")

    return {
      data: {
        medicamentos,
        insumos,
        servicios,
        otros
      }
    }
  } catch (error) {
    return { error: "Error al obtener formatos de bases" }
  }
}

export const getFormatoBaseById = async (id) => {
  try {
    const base = await prisma.formatoBase.findUnique({
      where: { id: parseInt(id) }
    })

    if (!base) {
      return { error: "Formato no encontrado" }
    }

    return { data: base }
  } catch (error) {
    return { error: "Error al obtener el formato" }
  }
}

export const createFormatoBase = async (data) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  const validatedFields = formatoBaseSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { titulo, tipoBase } = validatedFields.data

  try {
    await prisma.formatoBase.create({
      data: {
        titulo,
        tipoBase,
        documento: data.documento || ""
      }
    })

    revalidatePath("/dashboard/formato-bases")
    return { success: true }
  } catch (error) {
    return { error: "Error al crear el formato" }
  }
}

export const updateFormatoBase = async (id, data) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  const validatedFields = formatoBaseSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { titulo, tipoBase } = validatedFields.data

  try {
    await prisma.formatoBase.update({
      where: { id: parseInt(id) },
      data: {
        titulo,
        tipoBase,
        documento: data.documento || ""
      }
    })

    revalidatePath("/dashboard/formato-bases")
    return { success: true }
  } catch (error) {
    return { error: "Error al actualizar el formato" }
  }
}

export const deleteFormatoBase = async (id) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  try {
    await prisma.formatoBase.delete({
      where: { id: parseInt(id) }
    })

    revalidatePath("/dashboard/formato-bases")
    return { success: true }
  } catch (error) {
    return { error: "Error al eliminar el formato" }
  }
}
