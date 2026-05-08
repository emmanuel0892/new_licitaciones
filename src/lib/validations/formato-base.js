import { z } from "zod"

export const formatoBaseSchema = z.object({
  titulo: z
    .string()
    .min(1, "El título es requerido")
    .min(3, "El título debe tener al menos 3 caracteres"),
  tipoBase: z
    .enum(["Medicamentos", "Insumos", "Servicios", "Otros Formatos"], {
      errorMap: () => ({ message: "Debe seleccionar una categoría válida" })
    })
})
