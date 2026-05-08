import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Ingrese un correo electrónico válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
})

export const registerSchema = z.object({
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
    .max(12, "El RUT no puede tener más de 12 caracteres"),
  email: z
    .string()
    .min(1, "El correo electrónico es requerido")
    .email("Ingrese un correo electrónico válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(/[A-Z]/, "La contraseña debe tener al menos una mayúscula")
    .regex(/[a-z]/, "La contraseña debe tener al menos una minúscula")
    .regex(/[0-9]/, "La contraseña debe tener al menos un número")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "La contraseña debe tener al menos un símbolo"),
  typeAccount: z
    .string()
    .min(1, "El tipo de cuenta es requerido"),
  departamento: z
    .string()
    .min(1, "El departamento es requerido")
})

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  lastname: z
    .string()
    .min(1, "El apellido es requerido")
    .min(2, "El apellido debe tener al menos 2 caracteres"),
  typeAccount: z
    .string()
    .min(1, "El tipo de cuenta es requerido"),
  departamento: z
    .string()
    .min(1, "El departamento es requerido"),
  password: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true
      return val.length >= 6
    }, "La contraseña debe tener al menos 6 caracteres")
})
