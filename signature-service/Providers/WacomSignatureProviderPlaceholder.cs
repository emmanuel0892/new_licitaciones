using SignatureService.Models;

namespace SignatureService.Providers
{
    // TODO: Instalar Wacom STU SDK.
    // TODO: Agregar referencia real a Interop.wgssSTU.dll.
    // TODO: Reemplazar WacomSignatureProviderPlaceholder por WacomStuSignatureProvider.
    // TODO: Detectar aquí la Wacom STU-540 real.
    // TODO: Capturar puntos reales del lápiz desde la tableta.
    // TODO: Enviar puntos reales al WebSocket.
    // TODO: Generar imagen PNG/base64 real desde los puntos capturados.
    public class WacomSignatureProviderPlaceholder : IWacomSignatureProvider
    {
        public SignatureStatusResponse GetStatus()
        {
            return new SignatureStatusResponse
            {
                ServiceRunning = true,
                Connected = false,
                Device = null,
                SdkConnected = false,
                Message = "Servicio local activo. Falta conectar el SDK real de Wacom STU."
            };
        }

        public SignatureActionResponse StartSignature()
        {
            return new SignatureActionResponse
            {
                Success = false,
                Message = "No se puede iniciar la firma porque el SDK real de Wacom STU aún no está conectado."
            };
        }

        public SignatureActionResponse ClearSignature()
        {
            return new SignatureActionResponse
            {
                Success = false,
                Message = "No se puede limpiar la firma porque el SDK real de Wacom STU aún no está conectado."
            };
        }

        public SignatureSaveResponse SaveSignature()
        {
            return new SignatureSaveResponse
            {
                Success = false,
                ImageBase64 = null,
                Message = "No hay firma real para guardar porque el SDK de Wacom STU aún no está conectado."
            };
        }

        public SignatureActionResponse StopSignature()
        {
            return new SignatureActionResponse
            {
                Success = true,
                Message = "Servicio finalizado correctamente. No había una sesión real activa."
            };
        }
    }
}
