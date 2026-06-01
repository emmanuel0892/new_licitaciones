"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SIGCAPTX_PORT = 8000;
const RENDER_WIDTH = 300;
const RENDER_HEIGHT = 120;

// Wacom Ink SDK for signature - Lite License (gratuita, JWT)
// Fuente: https://github.com/Wacom-Developer/sdk-for-signature-sigcaptx-windows/blob/master/GETTING-STARTED.md
const WACOM_LICENCE = "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiI3YmM5Y2IxYWIxMGE0NmUxODI2N2E5MTJkYTA2ZTI3NiIsImV4cCI6MjE0NzQ4MzY0NywiaWF0IjoxNTYwOTUwMjcyLCJyaWdodHMiOlsiU0lHX1NES19DT1JFIiwiU0lHQ0FQVFhfQUNDRVNTIl0sImRldmljZXMiOlsiV0FDT01fQU5ZIl0sInR5cGUiOiJwcm9kIiwibGljX25hbWUiOiJTaWduYXR1cmUgU0RLIiwid2Fjb21faWQiOiI3YmM5Y2IxYWIxMGE0NmUxODI2N2E5MTJkYTA2ZTI3NiIsImxpY191aWQiOiJiODUyM2ViYi0xOGI3LTQ3OGEtYTlkZS04NDlmZTIyNmIwMDIiLCJhcHBzX3dpbmRvd3MiOltdLCJhcHBzX2lvcyI6W10sImFwcHNfYW5kcm9pZCI6W10sIm1hY2hpbmVfaWRzIjpbXX0.ONy3iYQ7lC6rQhou7rz4iJT_OJ20087gWz7GtCgYX3uNtKjmnEaNuP3QkjgxOK_vgOrTdwzD-nm-ysiTDs2GcPlOdUPErSp_bcX8kFBZVmGLyJtmeInAW6HuSp2-57ngoGFivTH_l1kkQ1KMvzDKHJbRglsPpd4nVHhx9WkvqczXyogldygvl0LRidyPOsS5H2GYmaPiyIp9In6meqeNQ1n9zkxSHo7B11mp_WXJXl0k1pek7py8XYCedCNW5qnLi4UCNlfTd6Mk9qz31arsiWsesPeR9PN121LBJtiPi023yQU8mgb9piw_a-ccciviJuNsEuRDN3sGnqONG3dMSA";

const CERT_URL = `https://localhost:${SIGCAPTX_PORT}`;

/**
 * Hook para capturar firma digital desde una tableta Wacom STU-540
 * usando el SDK SigCaptX que corre como servicio local en Windows.
 *
 * Requiere:
 * - SigCaptX Service instalado y corriendo (WacomSigCaptX)
 * - /public/sdk/wgssSigCaptX.js copiado del SDK
 * - En HTTPS: aceptar certificado auto-firmado en https://localhost:8000
 */
export default function useWacomSignature() {
  const [sdkReady, setSdkReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState(null);
  const [needsCert, setNeedsCert] = useState(false);
  const sdkRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Cargar el script del SDK dinámicamente
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (scriptLoadedRef.current) return;

    // Si ya existe en window, reutilizar
    if (window.WacomGSS_SignatureSDK) {
      scriptLoadedRef.current = true;
      initSDK();
      return;
    }

    const script = document.createElement("script");
    script.src = "/sdk/wgssSigCaptX.js";
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      initSDK();
    };
    script.onerror = () => {
      setError("No se pudo cargar el SDK de Wacom SigCaptX");
    };
    document.head.appendChild(script);

    return () => {
      // No removemos el script para evitar problemas de reconexión
    };
  }, []);

  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  const initSDK = useCallback(() => {
    if (!window.WacomGSS_SignatureSDK) {
      setError("SDK de Wacom no disponible");
      return;
    }

    try {
      const sdk = new window.WacomGSS_SignatureSDK(() => {
        if (sdk.running) {
          console.log("[Wacom] SigCaptX conectado, versión SDK:", sdk.version);
          sdkRef.current = sdk;
          setSdkReady(true);
          setNeedsCert(false);
          setError(null);
        } else {
          console.warn("[Wacom] SigCaptX no está corriendo");
          if (isHttps) {
            console.warn("[Wacom] Página HTTPS detectada. Posible problema de certificado.");
            setNeedsCert(true);
            setError(
              "No se pudo conectar con el servicio Wacom. Si es la primera vez, debe aceptar el certificado de seguridad."
            );
          } else {
            setError(
              "El servicio Wacom SigCaptX no está activo. Verifique que el servicio esté iniciado."
            );
          }
          setSdkReady(false);
        }
      }, SIGCAPTX_PORT);
    } catch (e) {
      console.error("[Wacom] Error inicializando SDK:", e);
      if (isHttps) {
        setNeedsCert(true);
        setError(
          "Error de conexión segura con Wacom. Debe aceptar el certificado de seguridad."
        );
      } else {
        setError("Error al conectar con el servicio Wacom: " + e.message);
      }
    }
  }, [isHttps]);

  /**
   * Inicia la captura de firma en la tableta STU-540.
   * Retorna una promesa que resuelve con la imagen base64 (data:image/png;base64,...)
   * o null si el usuario canceló.
   */
  const captureSignature = useCallback(
    (who = "Usuario", why = "Firma Digital") => {
      return new Promise((resolve, reject) => {
        const sdk = sdkRef.current;
        if (!sdk || !sdk.running) {
          reject(new Error("SDK no está conectado"));
          return;
        }

        setCapturing(true);
        setError(null);

        // Paso 1: Crear SigCtl
        const sigCtl = new sdk.SigCtl((sigCtlObj, status) => {
          if (status !== 0) {
            setCapturing(false);
            reject(new Error("Error creando SigCtl: status " + status));
            return;
          }

          // Paso 2: Aplicar licencia Lite al SigCtl
          sigCtlObj.PutLicence(WACOM_LICENCE, (sigCtlLic, licStatus) => {
            if (licStatus !== 0) {
              console.warn("[Wacom] Licencia SigCtl status:", licStatus);
            }

            // Paso 3: Crear DynamicCapture
            const dynCapt = new sdk.DynamicCapture((dynCaptObj, dcStatus) => {
              if (dcStatus !== 0) {
                setCapturing(false);
                reject(new Error("Error creando DynamicCapture: status " + dcStatus));
                return;
              }

              // Paso 4: Aplicar licencia Lite al DynamicCapture
              dynCaptObj.PutLicence(WACOM_LICENCE, (dynLic, dynLicStatus) => {
                if (dynLicStatus !== 0) {
                  console.warn("[Wacom] Licencia DynCapt status:", dynLicStatus);
                }

                // Paso 5: Iniciar captura en la tableta
                dynCaptObj.Capture(
                  sigCtlObj,
                  who,
                  why,
                  null,
                  null,
                  (dynCaptResult, sigObj, captStatus) => {
                    if (captStatus === sdk.DynamicCaptureResult.DynCaptOK) {
                      const renderFlags =
                        sdk.RBFlags.RenderOutputBase64 |
                        sdk.RBFlags.RenderColor32BPP |
                        sdk.RBFlags.RenderColorAntiAlias;

                      sigObj.RenderBitmap(
                        "png",
                        RENDER_WIDTH,
                        RENDER_HEIGHT,
                        1.0,
                        0x000000,
                        0xffffff,
                        renderFlags,
                        0,
                        0,
                        (sigObjResult, base64OrBmp, renderStatus) => {
                          setCapturing(false);
                          if (renderStatus === 0 && base64OrBmp) {
                            resolve("data:image/png;base64," + base64OrBmp);
                          } else {
                            reject(new Error("Error renderizando firma: status " + renderStatus));
                          }
                        }
                      );
                    } else if (captStatus === sdk.DynamicCaptureResult.DynCaptCancel) {
                      setCapturing(false);
                      resolve(null);
                    } else {
                      setCapturing(false);
                      let errorMsg = "Error en la captura";
                      switch (captStatus) {
                        case sdk.DynamicCaptureResult.DynCaptPadError:
                          errorMsg = "Error de conexión con la tableta. Verifique que la STU-540 esté conectada.";
                          break;
                        case sdk.DynamicCaptureResult.DynCaptError:
                          errorMsg = "Error general en la captura de firma";
                          break;
                        case sdk.DynamicCaptureResult.DynCaptNotLicensed:
                          errorMsg = "Licencia de Wacom no válida (modo evaluación)";
                          break;
                        case sdk.DynamicCaptureResult.DynCaptAbort:
                          errorMsg = "Captura abortada";
                          break;
                        default:
                          errorMsg = "Error desconocido: " + captStatus;
                      }
                      setError(errorMsg);
                      reject(new Error(errorMsg));
                    }
                  }
                );
              }); // PutLicence DynCapt
            }); // DynamicCapture constructor
          }); // PutLicence SigCtl
        }); // SigCtl constructor
      }); // Promise
    },
    []
  );

  const openCertPage = useCallback(() => {
    window.open(CERT_URL, "_blank");
  }, []);

  const retryConnection = useCallback(() => {
    setError(null);
    setNeedsCert(false);
    setSdkReady(false);
    scriptLoadedRef.current = false;
    initSDK();
  }, [initSDK]);

  return {
    sdkReady,
    capturing,
    error,
    needsCert,
    certUrl: CERT_URL,
    captureSignature,
    openCertPage,
    retryConnection,
  };
}
