import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const funcRut = searchParams.get("func_rut")

    if (!funcRut) {
      return NextResponse.json(
        { success: false, message: "Debe indicar func_rut." },
        { status: 400 }
      )
    }

    const baseUrl = process.env.MIHIS_FIRMAS_BASE_URL
    const sistema = process.env.MIHIS_FIRMAS_SISTEMA
    const apiKey = process.env.MIHIS_FIRMAS_API_KEY

    if (!baseUrl || !sistema || !apiKey) {
      return NextResponse.json(
        { success: false, message: "Faltan variables de entorno de la API de firmas." },
        { status: 500 }
      )
    }

    const response = await fetch(`${baseUrl}/consultar_firma.php?func_rut=${encodeURIComponent(funcRut)}`, {
      method: "GET",
      headers: {
        "X-Sistema": sistema,
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    })

    const data = await response.json().catch(() => null)

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Error consultando firma.",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
