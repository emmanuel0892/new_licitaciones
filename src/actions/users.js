"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { registerSchema, updateUserSchema } from "@/lib/validations/auth"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export const getUsers = async () => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        lastname: true,
        rut: true,
        email: true,
        typeAccount: true,
        departamento: true,
        active: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    })

    return { data: users }
  } catch (error) {
    return { error: "Error al obtener usuarios" }
  }
}

export const getUserById = async (id) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        lastname: true,
        rut: true,
        email: true,
        typeAccount: true,
        departamento: true,
        active: true
      }
    })

    if (!user) {
      return { error: "Usuario no encontrado" }
    }

    return { data: user }
  } catch (error) {
    return { error: "Error al obtener usuario" }
  }
}

export const createUser = async (data) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  const validatedFields = registerSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { name, lastname, rut, email, password, typeAccount, departamento } = validatedFields.data

  const existingUserByEmail = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUserByEmail) {
    return { error: "El correo electrónico ya está registrado" }
  }

  const existingUserByRut = await prisma.user.findUnique({
    where: { rut }
  })

  if (existingUserByRut) {
    return { error: "El RUT ya está registrado" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    await prisma.user.create({
      data: {
        name,
        lastname,
        rut,
        email,
        password: hashedPassword,
        typeAccount,
        departamento
      }
    })

    revalidatePath("/dashboard/usuarios")
    return { success: true }
  } catch (error) {
    return { error: "Error al crear el usuario" }
  }
}

export const updateUser = async (id, data) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  const validatedFields = updateUserSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { name, lastname, typeAccount, departamento, password } = validatedFields.data

  try {
    const updateData = {
      name,
      lastname,
      typeAccount,
      departamento
    }

    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    })

    revalidatePath("/dashboard/usuarios")
    return { success: true }
  } catch (error) {
    return { error: "Error al actualizar el usuario" }
  }
}

export const changeUserStatus = async (id) => {
  const session = await auth()
  
  if (!session || session.user.typeAccount !== "Super Admin") {
    return { error: "No autorizado" }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { active: true }
    })

    if (!user) {
      return { error: "Usuario no encontrado" }
    }

    const newStatus = user.active === "active" ? "desactive" : "active"

    await prisma.user.update({
      where: { id },
      data: { active: newStatus }
    })

    revalidatePath("/dashboard/usuarios")
    return { success: true, newStatus }
  } catch (error) {
    return { error: "Error al cambiar el estado del usuario" }
  }
}
