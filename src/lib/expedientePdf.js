import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

// Generador del expediente auditable de una licitacion en PDF (Fase 4).
// Recibe un objeto estructurado y devuelve los bytes del PDF (Uint8Array).

const A4 = [595.28, 841.89]
const MARGIN = 50

const BRAND = rgb(0.576, 0.753, 0.122) // #93c01f
const BRAND_DARK = rgb(0.435, 0.576, 0.09)
const DARK = rgb(0.12, 0.15, 0.21)
const GRAY = rgb(0.42, 0.45, 0.5)
const SOFT_BG = rgb(0.95, 0.97, 0.9)

export const construirExpedientePdf = async (expediente) => {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const [width, height] = A4
  const contentWidth = width - MARGIN * 2

  let page = pdf.addPage(A4)
  let y = height - MARGIN

  const newPage = () => {
    page = pdf.addPage(A4)
    y = height - MARGIN
  }

  const ensure = (needed) => {
    if (y - needed < MARGIN + 24) newPage()
  }

  const wrap = (text, f, size, maxW) => {
    const words = String(text ?? "").replace(/\s+/g, " ").trim().split(" ")
    const lines = []
    let line = ""
    for (const w of words) {
      const test = line ? `${line} ${w}` : w
      if (f.widthOfTextAtSize(test, size) > maxW && line) {
        lines.push(line)
        line = w
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    return lines.length ? lines : [""]
  }

  const drawText = (text, { size = 10, f = font, color = DARK, indent = 0, gap = 4 } = {}) => {
    const lines = wrap(text, f, size, contentWidth - indent)
    for (const ln of lines) {
      ensure(size + gap)
      page.drawText(ln, { x: MARGIN + indent, y: y - size, size, font: f, color })
      y -= size + gap
    }
  }

  const sectionTitle = (t) => {
    ensure(30)
    y -= 6
    page.drawRectangle({ x: MARGIN, y: y - 18, width: contentWidth, height: 22, color: SOFT_BG })
    page.drawText(t, { x: MARGIN + 8, y: y - 13, size: 12, font: fontBold, color: BRAND_DARK })
    y -= 30
  }

  const labelValue = (label, value) => {
    const size = 10
    const labelW = 150
    ensure(size + 5)
    page.drawText(label, { x: MARGIN, y: y - size, size, font: fontBold, color: GRAY })
    const lines = wrap(value || "—", font, size, contentWidth - labelW)
    page.drawText(lines[0], { x: MARGIN + labelW, y: y - size, size, font, color: DARK })
    y -= size + 5
    for (let i = 1; i < lines.length; i++) {
      ensure(size + 5)
      page.drawText(lines[i], { x: MARGIN + labelW, y: y - size, size, font, color: DARK })
      y -= size + 5
    }
  }

  const divider = () => {
    ensure(10)
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: width - MARGIN, y },
      thickness: 0.5,
      color: rgb(0.9, 0.92, 0.86)
    })
    y -= 10
  }

  // ── Encabezado ──────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: BRAND })
  page.drawText("Hospital Dr. Franco Ravera Zunino", {
    x: MARGIN, y: height - 36, size: 16, font: fontBold, color: rgb(1, 1, 1)
  })
  page.drawText("Expediente de Licitación", {
    x: MARGIN, y: height - 56, size: 11, font, color: rgb(1, 1, 1)
  })
  y = height - 90

  const { licitacion, historial = [], documentos = [], firmas = [] } = expediente

  // ── Datos generales ─────────────────────────────────────────────────
  sectionTitle("Datos generales")
  labelValue("Nombre:", licitacion.nombreLicitacion)
  labelValue("N° / ID anterior:", licitacion.numeroLicitacion)
  labelValue("Formato:", licitacion.formato)
  labelValue("Requirente:", licitacion.requirente)
  labelValue("Estado:", licitacion.estado)
  labelValue("Monto presupuestado:", licitacion.monto)
  labelValue("Vigencia:", licitacion.vigencia)
  labelValue("Proceso actual:", licitacion.procesoActual)
  labelValue("Creador:", licitacion.creador)
  labelValue("Fecha de creación:", licitacion.createdAt)

  // ── Historial ───────────────────────────────────────────────────────
  sectionTitle(`Historial (${historial.length})`)
  if (historial.length === 0) {
    drawText("Sin registros de historial.", { color: GRAY })
  } else {
    historial.forEach((h, i) => {
      drawText(`${h.fecha}  ·  ${h.accion}`, { f: fontBold, size: 10 })
      if (h.origen || h.destino) {
        drawText(`Movimiento: ${h.origen || "—"} → ${h.destino || "—"}`, { size: 9, color: GRAY, indent: 8 })
      }
      if (h.campoModificado) {
        drawText(`Campo: ${h.campoModificado}  (${h.datoAntiguo || "—"} → ${h.datoNuevo || "—"})`, { size: 9, color: GRAY, indent: 8 })
      }
      if (h.usuario) drawText(`Usuario: ${h.usuario}`, { size: 9, color: GRAY, indent: 8 })
      if (h.observacion) drawText(`Observación: ${h.observacion}`, { size: 9, color: DARK, indent: 8 })
      if (i < historial.length - 1) divider()
    })
  }

  // ── Documentos ──────────────────────────────────────────────────────
  sectionTitle(`Documentos (${documentos.length})`)
  if (documentos.length === 0) {
    drawText("Sin documentos cargados.", { color: GRAY })
  } else {
    documentos.forEach((d) => {
      drawText(`• ${d.nombre}`, { size: 10, f: fontBold })
      const meta = [
        d.tipo ? `Tipo: ${d.tipo}` : null,
        d.paso ? `Paso: ${d.paso}` : null,
        d.proceso ? `Proceso: ${d.proceso}` : null,
        d.fecha ? `Fecha: ${d.fecha}` : null
      ].filter(Boolean).join("  ·  ")
      if (meta) drawText(meta, { size: 9, color: GRAY, indent: 10 })
    })
  }

  // ── Firmas ──────────────────────────────────────────────────────────
  sectionTitle(`Firmas (${firmas.length})`)
  if (firmas.length === 0) {
    drawText("Sin firmas registradas.", { color: GRAY })
  } else {
    firmas.forEach((f) => {
      drawText(`• Paso ${f.paso}: ${f.label}`, { size: 10, f: fontBold })
      const meta = [f.usuario ? `Firmante: ${f.usuario}` : null, f.fecha ? `Fecha: ${f.fecha}` : null]
        .filter(Boolean).join("  ·  ")
      if (meta) drawText(meta, { size: 9, color: GRAY, indent: 10 })
    })
  }

  // ── Pie de página en todas las páginas ──────────────────────────────
  const pages = pdf.getPages()
  const total = pages.length
  pages.forEach((p, idx) => {
    p.drawText(`Generado el ${expediente.generadoEl}`, {
      x: MARGIN, y: 28, size: 8, font, color: GRAY
    })
    p.drawText(`Página ${idx + 1} de ${total}`, {
      x: width - MARGIN - 70, y: 28, size: 8, font, color: GRAY
    })
    p.drawText("Documento generado automáticamente — Sistema de Gestión de Licitaciones", {
      x: MARGIN, y: 16, size: 7, font, color: GRAY
    })
  })

  return pdf.save()
}
