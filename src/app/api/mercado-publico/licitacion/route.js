import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { fetchLicitacionMercadoPublico } from "@/lib/mercadoPublico"
import { PERMISSION_CODES, userHasPermission } from "@/lib/permissions"
import { consultaMercadoPublicoSchema } from "@/lib/validations/licitacion"

export const dynamic = "force-dynamic"

const getCodigosOrdenesCompraIndexados = async (codigoLicitacion) => {
  const licitacionMP = await prisma.licitacionMP.findUnique({
    where: { codigoExterno: codigoLicitacion },
    select: { id: true }
  })
  const orConditions = [{ codigoLicitacion }]

  if (licitacionMP?.id) {
    orConditions.push({ licitacionMPId: licitacionMP.id })
  }

  const ordenesCompra = await prisma.ordenCompraMP.findMany({
    where: { OR: orConditions },
    select: { codigo: true },
    distinct: ["codigo"]
  })

  return ordenesCompra.map((orden) => orden.codigo).filter(Boolean)
}

export const GET = async (request) => {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const allowed = await userHasPermission(
    session.user.id,
    PERMISSION_CODES.MERCADO_PUBLICO_VIEW
  )

  if (!allowed) {
    return NextResponse.json(
      { error: "No tienes permisos para consultar Mercado Publico." },
      { status: 403 }
    )
  }

  const validatedFields = consultaMercadoPublicoSchema.safeParse({
    codigo: request.nextUrl.searchParams.get("codigo")
  })

  if (!validatedFields.success) {
    const error = validatedFields.error.flatten().fieldErrors.codigo?.[0]
    return NextResponse.json({ error: error || "Codigo invalido" }, { status: 400 })
  }

  try {
    const codigosOrdenCompra = await getCodigosOrdenesCompraIndexados(validatedFields.data.codigo)
    const data = await fetchLicitacionMercadoPublico(validatedFields.data.codigo, {
      codigosOrdenCompra
    })
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "No se pudo consultar Mercado Publico." },
      { status: 502 }
    )
  }
}
