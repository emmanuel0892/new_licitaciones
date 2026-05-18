import { NextResponse } from "next/server"

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      func_rut,
      firma_base64,
      formato_mime,
      modificado_por,
    } = body

    if (!func_rut || !firma_base64 || !formato_mime || !modificado_por) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan campos obligatorios.",
        },
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

    const payload = {
      func_rut,
      firma_base64,
      formato_mime,
      modificado_por,
    }

    const response = await fetch(`${baseUrl}/crear_firma.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sistema": sistema,
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
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
        message: "Error creando firma.",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
