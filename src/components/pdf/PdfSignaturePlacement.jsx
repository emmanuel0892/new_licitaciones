"use client"

import { useState, useRef, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { Button } from "antd"
import { DragOutlined } from "@ant-design/icons"
import "./PdfSignaturePlacement.css"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const PdfSignaturePlacement = ({ pdfUrl, firmaBase64, onPlacementChange, initialPlacement }) => {
  const [numPages, setNumPages] = useState(null)
  const [placement, setPlacement] = useState(
    initialPlacement || {
      page: 1,
      x: 80,
      y: 80,
      width: 180,
      height: 70
    }
  )
  const [dragging, setDragging] = useState(false)
  const [showPlacement, setShowPlacement] = useState(false)
  const containerRef = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    setDragging(true)
  }

  const handlePointerMove = (e) => {
    if (!dragging || !containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    let nextX = e.clientX - containerRect.left - dragOffset.current.x
    let nextY = e.clientY - containerRect.top - dragOffset.current.y

    nextX = Math.max(0, Math.min(nextX, containerRect.width - placement.width))
    nextY = Math.max(0, Math.min(nextY, containerRect.height - placement.height))

    const nextPlacement = {
      ...placement,
      x: nextX,
      y: nextY
    }

    setPlacement(nextPlacement)
    onPlacementChange?.(nextPlacement)
  }

  const handlePointerUp = () => {
    setDragging(false)
  }

  useEffect(() => {
    if (dragging) {
      document.addEventListener("pointermove", handlePointerMove)
      document.addEventListener("pointerup", handlePointerUp)
    } else {
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
    }
    return () => {
      document.removeEventListener("pointermove", handlePointerMove)
      document.removeEventListener("pointerup", handlePointerUp)
    }
  }, [dragging, placement])

  const handleSelectPlacement = () => {
    setShowPlacement(true)
    onPlacementChange?.(placement)
  }

  const handleResetPlacement = () => {
    setShowPlacement(false)
    const defaultPlacement = {
      page: 1,
      x: 80,
      y: 80,
      width: 180,
      height: 70
    }
    setPlacement(defaultPlacement)
    onPlacementChange?.(defaultPlacement)
  }

  return (
    <div className="pdf-clean-wrapper">
      <div style={{ marginBottom: 12 }}>
        <Button
          type={showPlacement ? "primary" : "default"}
          onClick={showPlacement ? handleResetPlacement : handleSelectPlacement}
          icon={<DragOutlined />}
        >
          {showPlacement ? "Restablecer ubicación" : "Seleccionar ubicación de firma"}
        </Button>
      </div>

      <div className="pdf-page-container" ref={containerRef}>
        <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
          <Page
            pageNumber={1}
            width={720}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>

        {showPlacement && firmaBase64 && (
          <div
            className="signature-box"
            style={{
              left: placement.x,
              top: placement.y,
              width: placement.width,
              height: placement.height,
              cursor: dragging ? "grabbing" : "grab"
            }}
            onPointerDown={handlePointerDown}
          >
            <div className="signature-box-label">Firma</div>
            <img src={firmaBase64} alt="Firma" />
          </div>
        )}
      </div>
    </div>
  )
}

export default PdfSignaturePlacement
