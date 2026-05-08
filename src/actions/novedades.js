"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { novedadSchema } from "@/lib/validations/novedad"

export const getNovedades = async () => {
  try {
    const novedades = await prisma.novedad.findMany({
      orderBy: { createdAt: "desc" }
    })

    return { data: novedades }
  } catch (error) {
    return { error: "Error al obtener novedades" }
  }
}

export const getNovedadById = async (id) => {
  try {
    const novedad = await prisma.novedad.findUnique({
      where: { id: parseInt(id) }
    })

    if (!novedad) {
      return { error: "Novedad no encontrada" }
    }

    return { data: novedad }
  } catch (error) {
    return { error: "Error al obtener la novedad" }
  }
}

export const createNovedad = async (data) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  const validatedFields = novedadSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { titular, descripcion } = validatedFields.data

  try {
    await prisma.novedad.create({
      data: {
        titular,
        descripcion,
        imagen: data.imagen || null
      }
    })

    revalidatePath("/dashboard/novedades")
    return { success: true }
  } catch (error) {
    return { error: "Error al crear la novedad" }
  }
}

export const updateNovedad = async (id, data) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  const validatedFields = novedadSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { titular, descripcion } = validatedFields.data

  try {
    await prisma.novedad.update({
      where: { id: parseInt(id) },
      data: {
        titular,
        descripcion,
        imagen: data.imagen || null
      }
    })

    revalidatePath("/dashboard/novedades")
    return { success: true }
  } catch (error) {
    return { error: "Error al actualizar la novedad" }
  }
}

export const deleteNovedad = async (id) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  try {
    await prisma.novedad.delete({
      where: { id: parseInt(id) }
    })

    revalidatePath("/dashboard/novedades")
    return { success: true }
  } catch (error) {
    return { error: "Error al eliminar la novedad" }
  }
}
