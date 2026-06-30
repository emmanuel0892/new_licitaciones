import { z } from "zod"

// Validacion de las preferencias de notificacion por usuario.
export const preferenciaNotificacionSchema = z.object({
  emailPlazos: z.boolean().default(true),
  emailConsumo: z.boolean().default(true),
  emailAsignacion: z.boolean().default(true)
})

// Validacion de los datos minimos para registrar un envio (idempotencia).
export const notificacionEnviadaSchema = z.object({
  usuarioId: z.string().min(1),
  tipo: z.enum(["plazo", "consumo", "asignacion"]),
  referencia: z.string().min(1),
  canal: z.enum(["email"]).default("email")
})
