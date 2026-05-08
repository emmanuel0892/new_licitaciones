import { z } from "zod"

export const novedadSchema = z.object({
  titular: z
    .string()
    .min(1, "El titular es requerido")
    .min(5, "El titular debe tener al menos 5 caracteres"),
  descripcion: z
    .string()
    .min(1, "La descripción es requerida")
    .min(10, "La descripción debe tener al menos 10 caracteres")
})
