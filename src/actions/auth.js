"use server"

import { signIn, signOut } from "@/lib/auth"
import { AuthError } from "next-auth"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth"

export const loginAction = async (formData) => {
  const email = formData.get("email")
  const password = formData.get("password")

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false
    })

    return { success: true }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Credenciales inválidas" }
        default:
          if (error.message.includes("Usuario desactivado")) {
            return { error: "Usuario desactivado. Contacte al administrador." }
          }
          return { error: "Error al iniciar sesión" }
      }
    }
    throw error
  }
}

export const logoutAction = async () => {
  await signOut({ redirect: false })
  return { success: true }
}

export const registerAction = async (data) => {
  const validatedFields = registerSchema.safeParse(data)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
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

    return { success: true }
  } catch (error) {
    return { error: "Error al crear el usuario" }
  }
}
