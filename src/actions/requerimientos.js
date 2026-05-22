"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { requerimientoSchema } from "@/lib/validations/requerimiento"

export const getRequerimientos = async () => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  const userType = session.user.typeAccount
  if (userType !== "Super Admin" && userType !== "Secretaria Abastecimiento") {
    return { error: "No tiene permisos" }
  }

  try {
    const requerimientos = await prisma.requerimientoAbastecimiento.findMany({
      include: {
        productos: true,
        historial: { orderBy: { createdAt: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    })

    return { data: requerimientos }
  } catch (error) {
    return { error: "Error al obtener requerimientos" }
  }
}

export const getRequerimientoById = async (id) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    const requerimiento = await prisma.requerimientoAbastecimiento.findUnique({
      where: { id: parseInt(id) },
      include: {
        productos: true,
        historial: { orderBy: { createdAt: "desc" } }
      }
    })

    if (!requerimiento) {
      return { error: "Requerimiento no encontrado" }
    }

    return { data: requerimiento }
  } catch (error) {
    return { error: "Error al obtener requerimiento" }
  }
}

export const createRequerimiento = async (data) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  const userType = session.user.typeAccount
  if (userType !== "Super Admin" && userType !== "Secretaria Abastecimiento") {
    return { error: "No tiene permisos" }
  }

  const validatedFields = requerimientoSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { titulo, descripcion } = validatedFields.data

  try {
    const requerimiento = await prisma.requerimientoAbastecimiento.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        historial: {
          create: {
            accion: "Creación",
            descripcion: "Requerimiento creado"
          }
        }
      }
    })

    revalidatePath("/dashboard/requerimientos")
    return { success: true, data: requerimiento }
  } catch (error) {
    return { error: "Error al crear requerimiento" }
  }
}

export const updateRequerimiento = async (id, data) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  const userType = session.user.typeAccount
  if (userType !== "Super Admin" && userType !== "Secretaria Abastecimiento") {
    return { error: "No tiene permisos" }
  }

  try {
    await prisma.requerimientoAbastecimiento.update({
      where: { id: parseInt(id) },
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        estado: data.estado,
        historial: {
          create: {
            accion: "Actualización",
            descripcion: data.observacion || "Requerimiento actualizado"
          }
        }
      }
    })

    revalidatePath("/dashboard/requerimientos")
    return { success: true }
  } catch (error) {
    return { error: "Error al actualizar requerimiento" }
  }
}

export const addProductoRequerimiento = async (requerimientoId, producto) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    await prisma.productoRequerimiento.create({
      data: {
        requerimientoId: parseInt(requerimientoId),
        nombreProducto: producto.nombreProducto,
        cantidad: producto.cantidad,
        stock: producto.stock || 0,
        cantidadProgramada: producto.cantidadProgramada || 0
      }
    })

    revalidatePath("/dashboard/requerimientos")
    return { success: true }
  } catch (error) {
    return { error: "Error al agregar producto" }
  }
}

export const deleteProductoRequerimiento = async (productoId) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  try {
    await prisma.productoRequerimiento.delete({
      where: { id: parseInt(productoId) }
    })

    revalidatePath("/dashboard/requerimientos")
    return { success: true }
  } catch (error) {
    return { error: "Error al eliminar producto" }
  }
}
