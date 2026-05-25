"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { PERMISSION_CODES, userHasPermission } from "@/lib/permissions"
import { novedadSchema } from "@/lib/validations/novedad"

const novedadIdSchema = z.coerce.number().int().positive("Novedad inválida")

const getValidatedNovedadId = (id) => {
  const validatedId = novedadIdSchema.safeParse(id)

  if (!validatedId.success) {
    return { error: validatedId.error.issues[0]?.message || "Novedad inválida" }
  }

  return { id: validatedId.data }
}

const getAuthorizedSession = async (permissionCode, permissionMessage) => {
  const session = await auth()

  if (!session) {
    return { error: "No autorizado" }
  }

  const allowed = await userHasPermission(session.user.id, permissionCode)

  if (!allowed) {
    return { error: permissionMessage }
  }

  return { session }
}

const revalidateNovedades = () => {
  revalidatePath("/dashboard/novedades")
  revalidatePath("/dashboard/novedades/gestion")
}

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
  const validatedId = getValidatedNovedadId(id)

  if (validatedId.error) {
    return validatedId
  }

  try {
    const novedad = await prisma.novedad.findUnique({
      where: { id: validatedId.id }
    })

    if (!novedad) {
      return { error: "Novedad no encontrada" }
    }

    return { data: novedad }
  } catch (error) {
    return { error: "Error al obtener la novedad" }
  }
}

export const getNovedadesGestion = async () => {
  const authorization = await getAuthorizedSession(
    PERMISSION_CODES.NOVEDADES_VIEW,
    "No tienes permisos para visualizar novedades."
  )

  if (authorization.error) {
    return authorization
  }

  try {
    const novedades = await prisma.novedad.findMany({
      orderBy: { createdAt: "desc" }
    })

    return { data: novedades }
  } catch (error) {
    return { error: "Error al obtener novedades" }
  }
}

export const getNovedadGestionById = async (id) => {
  const authorization = await getAuthorizedSession(
    PERMISSION_CODES.NOVEDADES_EDIT,
    "No tienes permisos para editar novedades."
  )

  if (authorization.error) {
    return authorization
  }

  const validatedId = getValidatedNovedadId(id)

  if (validatedId.error) {
    return validatedId
  }

  try {
    const novedad = await prisma.novedad.findUnique({
      where: { id: validatedId.id }
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
  const authorization = await getAuthorizedSession(
    PERMISSION_CODES.NOVEDADES_CREATE,
    "No tienes permisos para crear novedades."
  )

  if (authorization.error) {
    return authorization
  }

  const validatedFields = novedadSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { titular, descripcion, imagen } = validatedFields.data

  try {
    await prisma.novedad.create({
      data: {
        titular,
        descripcion,
        imagen: imagen || null
      }
    })

    revalidateNovedades()
    return { success: true }
  } catch (error) {
    return { error: "Error al crear la novedad" }
  }
}

export const updateNovedad = async (id, data) => {
  const authorization = await getAuthorizedSession(
    PERMISSION_CODES.NOVEDADES_EDIT,
    "No tienes permisos para editar novedades."
  )

  if (authorization.error) {
    return authorization
  }

  const validatedId = getValidatedNovedadId(id)

  if (validatedId.error) {
    return validatedId
  }

  const validatedFields = novedadSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { titular, descripcion, imagen } = validatedFields.data

  try {
    await prisma.novedad.update({
      where: { id: validatedId.id },
      data: {
        titular,
        descripcion,
        imagen: imagen || null
      }
    })

    revalidateNovedades()
    return { success: true }
  } catch (error) {
    return { error: "Error al actualizar la novedad" }
  }
}

export const deleteNovedad = async (id) => {
  const authorization = await getAuthorizedSession(
    PERMISSION_CODES.NOVEDADES_DELETE,
    "No tienes permisos para eliminar novedades."
  )

  if (authorization.error) {
    return authorization
  }

  const validatedId = getValidatedNovedadId(id)

  if (validatedId.error) {
    return validatedId
  }

  try {
    await prisma.novedad.delete({
      where: { id: validatedId.id }
    })

    revalidateNovedades()
    return { success: true }
  } catch (error) {
    return { error: "Error al eliminar la novedad" }
  }
}
