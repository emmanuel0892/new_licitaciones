"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { PERMISSION_CODES, userHasPermission } from "@/lib/permissions"

const ALLOWED_SIGNATURE_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_SIGNATURE_SIZE_BYTES = 2 * 1024 * 1024
const MAX_SIGNATURE_BASE64_LENGTH = Math.ceil((MAX_SIGNATURE_SIZE_BYTES * 4) / 3) + 200

const userSignatureSchema = z.object({
  userId: z.string().min(1, "El usuario es requerido"),
  firmaBase64: z
    .string()
    .min(1, "La firma es requerida")
    .refine((value) => {
      const match = value.match(/^data:([^;]+);base64,/)
      return match && ALLOWED_SIGNATURE_MIME_TYPES.includes(match[1])
    }, "Solo se permiten imagenes PNG, JPG, JPEG o WEBP")
    .refine((value) => value.length <= MAX_SIGNATURE_BASE64_LENGTH, "La firma no puede superar los 2MB")
})

const deleteUserSignatureSchema = z.object({
  userId: z.string().min(1, "El usuario es requerido")
})

const createUserSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  lastname: z
    .string()
    .min(1, "El apellido es requerido")
    .min(2, "El apellido debe tener al menos 2 caracteres"),
  rut: z
    .string()
    .min(8, "El RUT debe tener al menos 8 caracteres")
    .max(12, "El RUT no puede tener mas de 12 caracteres"),
  email: z
    .string()
    .min(1, "El correo electronico es requerido")
    .email("Ingrese un correo electronico valido"),
  password: z
    .string()
    .min(6, "La contrasena debe tener al menos 6 caracteres")
    .regex(/[A-Z]/, "La contrasena debe tener al menos una mayuscula")
    .regex(/[a-z]/, "La contrasena debe tener al menos una minuscula")
    .regex(/[0-9]/, "La contrasena debe tener al menos un numero")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "La contrasena debe tener al menos un simbolo"),
  departamento: z
    .string()
    .min(1, "El departamento es requerido"),
  roleId: z
    .string()
    .min(1, "Debe seleccionar al menos un rol")
})

const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  lastname: z
    .string()
    .min(1, "El apellido es requerido")
    .min(2, "El apellido debe tener al menos 2 caracteres"),
  departamento: z
    .string()
    .min(1, "El departamento es requerido"),
  roleId: z
    .string()
    .min(1, "Debe seleccionar al menos un rol"),
  password: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true
      return val.length >= 6
    }, "La contrasena debe tener al menos 6 caracteres")
})

const getValidRole = async (roleId = "") => {
  const roles = await prisma.roles.findMany({
    where: {
      id: {
        in: [roleId]
      }
    },
    select: {
      id: true,
      name: true
    }
  })

  if (roles.length !== 1) {
    return { error: "Se seleccionaron roles invalidos" }
  }

  return { data: roles }
}

const canManageUsers = async (userId) => {
  return userHasPermission(userId, PERMISSION_CODES.USERS_MANAGE)
}

export const getUsers = async () => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!await canManageUsers(session.user.id)) {
    return { error: "No tienes permisos para realizar esta acción." }
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
        firma: true,
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
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!await canManageUsers(session.user.id)) {
    return { error: "No tienes permisos para realizar esta acción." }
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
        firma: true,
        active: true,
        user_roles: {
          select: {
            role_id: true
          }
        }
      }
    })

    if (!user) {
      return { error: "Usuario no encontrado" }
    }

    return {
      data: {
        ...user,
        roleId: user.user_roles[0]?.role_id || ""
      }
    }
  } catch (error) {
    return { error: "Error al obtener usuario" }
  }
}

export const createUser = async (data) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!await canManageUsers(session.user.id)) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

  const validatedFields = createUserSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { name, lastname, rut, email, password, departamento, roleId } = validatedFields.data

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
  const validRoles = await getValidRole(roleId)

  if (validRoles.error) {
    return { error: validRoles.error }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const primaryRole = validRoles.data[0]?.name || "visor"

      const newUser = await tx.user.create({
        data: {
          name,
          lastname,
          rut,
          email,
          password: hashedPassword,
          typeAccount: primaryRole,
          departamento
        }
      })

      await tx.user_roles.createMany({
        data: validRoles.data.map((role) => ({
          user_id: newUser.id,
          role_id: role.id
        })),
        skipDuplicates: true
      })
    })

    revalidatePath("/dashboard/usuarios")
    return { success: true }
  } catch (error) {
    return { error: "Error al crear el usuario" }
  }
}

export const updateUser = async (id, data) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!await canManageUsers(session.user.id)) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

  const validatedFields = updateUserSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos inválidos" }
  }

  const { name, lastname, departamento, password, roleId } = validatedFields.data
  const validRoles = await getValidRole(roleId)

  if (validRoles.error) {
    return { error: validRoles.error }
  }

  try {
    const primaryRole = validRoles.data[0]?.name || "visor"
    const updateData = {
      name,
      lastname,
      typeAccount: primaryRole,
      departamento
    }

    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: updateData
      })

      await tx.user_roles.deleteMany({
        where: {
          user_id: id
        }
      })

      await tx.user_roles.createMany({
        data: validRoles.data.map((role) => ({
          user_id: id,
          role_id: role.id
        })),
        skipDuplicates: true
      })
    })

    revalidatePath("/dashboard/usuarios")
    return { success: true }
  } catch (error) {
    return { error: "Error al actualizar el usuario" }
  }
}

export const getRoles = async () => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!await canManageUsers(session.user.id)) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

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
    return { error: "Error al obtener roles" }
  }
}

export const changeUserStatus = async (id) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!await canManageUsers(session.user.id)) {
    return { error: "No tienes permisos para realizar esta acción." }
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

export const updateUserSignature = async (data) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!await canManageUsers(session.user.id)) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

  const validatedFields = userSignatureSchema.safeParse(data)

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos invalidos" }
  }

  const { userId, firmaBase64 } = validatedFields.data

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        firma: firmaBase64,
        updatedAt: new Date()
      }
    })

    revalidatePath("/dashboard/usuarios")
    return { success: true }
  } catch (error) {
    return { error: "Error al guardar la firma" }
  }
}

export const deleteUserSignature = async (userId) => {
  const session = await auth()
  
  if (!session) {
    return { error: "No autorizado" }
  }

  if (!await canManageUsers(session.user.id)) {
    return { error: "No tienes permisos para realizar esta acción." }
  }

  const validatedFields = deleteUserSignatureSchema.safeParse({ userId })

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors
    const firstError = Object.values(errors)[0]?.[0]
    return { error: firstError || "Datos invalidos" }
  }

  try {
    await prisma.user.update({
      where: { id: validatedFields.data.userId },
      data: {
        firma: null,
        updatedAt: new Date()
      }
    })

    revalidatePath("/dashboard/usuarios")
    return { success: true }
  } catch (error) {
    return { error: "Error al eliminar la firma" }
  }
}
