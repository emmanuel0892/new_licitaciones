import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

export async function GET(request, { params }) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const firmaId = Number(params.id)

    const firma = await prisma.licitacion_firmas.findUnique({
      where: { id: firmaId },
      include: {
        licitaciones: {
          select: {
            id: true
          }
        }
      }
    })

    if (!firma) {
      return NextResponse.json({ error: "Firma no encontrada" }, { status: 404 })
    }

    if (!firma.ruta_pdf_firmado) {
      return NextResponse.json({ error: "No existe ruta del documento firmado en la base de datos" }, { status: 404 })
    }

    const filePath = path.join(process.cwd(), firma.ruta_pdf_firmado)

    const fileBuffer = await fs.readFile(filePath)

    const fileName = firma.ruta_pdf_firmado.split("/").pop()

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`
      }
    })
  } catch (error) {
    console.error("Error al servir documento firmado:", error)
    return NextResponse.json({ error: `Error al servir documento: ${error.message}` }, { status: 500 })
  }
}
