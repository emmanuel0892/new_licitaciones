import { z } from "zod"

export const createLicitacionSchema = z.object({
  formatoLiquidacionId: z
    .string()
    .min(1, "Debe seleccionar un formato de liquidación"),
  requirente: z
    .string()
    .min(1, "El requirente es requerido"),
  numeroLicitacion: z
    .string()
    .optional(),
  vigencia: z
    .string()
    .optional(),
  nombreLicitacion: z
    .string()
    .min(1, "El nombre de la licitación es requerido"),
  montoPresupuestado: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val === "" || val === "null") return true
      return /^[0-9]+$/.test(val)
    }, "El monto debe contener solo números")
})

export const devolverLicitacionSchema = z.object({
  licitacionId: z
    .number()
    .min(1, "El ID de la licitación es requerido"),
  observacion: z
    .string()
    .min(1, "Debe ingresar un motivo de devolución")
    .min(10, "El motivo debe tener al menos 10 caracteres")
})

export const filtroLicitacionSchema = z.object({
  numeroLicitacion: z.string().optional(),
  usuarioId: z.string().optional(),
  estado: z.string().optional(),
  turno: z.string().optional()
})
