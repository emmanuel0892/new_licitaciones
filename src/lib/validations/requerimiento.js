import { z } from "zod"

export const requerimientoSchema = z.object({
  titulo: z
    .string()
    .min(1, "El título es requerido")
    .min(5, "El título debe tener al menos 5 caracteres"),
  descripcion: z
    .string()
    .optional()
})

export const productoRequerimientoSchema = z.object({
  nombreProducto: z
    .string()
    .min(1, "El nombre del producto es requerido"),
  cantidad: z
    .number()
    .min(1, "La cantidad debe ser mayor a 0"),
  stock: z
    .number()
    .min(0, "El stock no puede ser negativo")
    .optional(),
  cantidadProgramada: z
    .number()
    .min(0, "La cantidad programada no puede ser negativa")
    .optional()
})
