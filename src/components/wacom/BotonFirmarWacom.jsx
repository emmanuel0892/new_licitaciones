"use client";

import useWacomSignature from "@/hooks/useWacomSignature";
import { Alert, Button, Spin } from "antd";

export default function BotonFirmarWacom({
  nombreFirmante = "Usuario",
  motivoFirma = "Firma documento",
  onFirmaCapturada
}) {
  const {
    sdkReady,
    capturing,
    error,
    needsCert,
    certUrl,
    captureSignature,
    retryConnection
  } = useWacomSignature();

  const handleFirmar = async () => {
    try {
      const dataUrl = await captureSignature(nombreFirmante, motivoFirma);

      if (!dataUrl) return;

      if (typeof onFirmaCapturada === "function") {
        await onFirmaCapturada(dataUrl);
      }
    } catch (e) {
      console.error("Error capturando firma Wacom:", e);
    }
  };

  if (needsCert) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Aceptar certificado de Wacom"
        description={
          <div>
            <p>
              Para usar la tableta en este navegador, abre el certificado local,
              acéptalo y vuelve a intentar.
            </p>
            <a href={certUrl} target="_blank" rel="noreferrer">
              {certUrl}
            </a>
            <div style={{ marginTop: 8 }}>
              <Button onClick={retryConnection}>Reintentar</Button>
            </div>
          </div>
        }
      />
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message={error}
        action={<Button onClick={retryConnection}>Reintentar</Button>}
      />
    );
  }

  if (!sdkReady) {
    return <Spin tip="Conectando con la tableta..." />;
  }

  return (
    <Button type="primary" loading={capturing} onClick={handleFirmar}>
      {capturing ? "Firmando en la tableta..." : "Capturar firma con Wacom"}
    </Button>
  );
}
