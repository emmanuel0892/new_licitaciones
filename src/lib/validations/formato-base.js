import { z } from "zod"

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]

const MAX_FILE_SIZE = 10 * 1024 * 1024

export const formatoBaseSchema = z.object({
  titulo: z
    .string()
    .min(1, "El título es requerido")
    .min(3, "El título debe tener al menos 3 caracteres"),
  tipoBase: z
    .enum(["Medicamentos", "Insumos", "Servicios", "Otros Formatos"], {
      errorMap: () => ({ message: "Debe seleccionar una categoría válida" })
    }),
  nombreArchivo: z.string().optional(),
  rutaArchivo: z.string().optional()
})

export const formatoBaseClientSchema = z.object({
  titulo: z
    .string()
    .min(1, "El título es requerido")
    .min(3, "El título debe tener al menos 3 caracteres"),
  tipoBase: z
    .enum(["Medicamentos", "Insumos", "Servicios", "Otros Formatos"], {
      errorMap: () => ({ message: "Debe seleccionar una categoría válida" })
    }),
  archivo: z
    .instanceof(File)
    .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
      message: "Solo se permiten archivos PDF o Word (.doc, .docx)"
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "El archivo no puede superar los 10MB"
    })
    .optional()
})
