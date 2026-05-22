# wacom-signature-service

## Qué es
Servicio local en Windows que conecta el frontend Next.js con una tableta Wacom STU-540.

## Por qué existe
El navegador no puede controlar directamente la Wacom STU-540 por USB de forma estable, por eso se usa un servicio local en localhost.

## Estado actual
El servicio compila y expone endpoints, pero la integración real con Wacom requiere instalar y referenciar el SDK oficial.

## Cómo ejecutar

```bash
cd signature-service
dotnet restore
dotnet run
```

El servicio se iniciará en `http://localhost:5000`

## Endpoints

### GET http://localhost:5000/status
Verifica el estado del servicio y de la tableta.

**Respuesta actual (modo placeholder):**
```json
{
  "serviceRunning": true,
  "connected": false,
  "device": null,
  "sdkConnected": false,
  "message": "Servicio local activo. Falta conectar el SDK real de Wacom STU."
}
```

### POST http://localhost:5000/signature/start
Inicia la captura de firma.

**Respuesta actual (modo placeholder):**
```json
{
  "success": false,
  "message": "No se puede iniciar la firma porque el SDK real de Wacom STU aún no está conectado."
}
```

### POST http://localhost:5000/signature/clear
Limpia la firma.

**Respuesta actual (modo placeholder):**
```json
{
  "success": false,
  "message": "No se puede limpiar la firma porque el SDK real de Wacom STU aún no está conectado."
}
```

### POST http://localhost:5000/signature/save
Guarda la firma como imagen base64.

**Respuesta actual (modo placeholder):**
```json
{
  "success": false,
  "imageBase64": null,
  "message": "No hay firma real para guardar porque el SDK de Wacom STU aún no está conectado."
}
```

### POST http://localhost:5000/signature/stop
Finaliza la captura de firma.

**Respuesta actual (modo placeholder):**
```json
{
  "success": true,
  "message": "Servicio finalizado correctamente. No había una sesión real activa."
}
```

### WS ws://localhost:5000/signature/ws
WebSocket para comunicación en tiempo real con el frontend.

**Mensaje actual (modo placeholder):**
```json
{
  "type": "device_status",
  "connected": false,
  "message": "WebSocket conectado. Falta conectar el SDK real de Wacom STU."
}
```

## Errores comunes

### CS0246 wgssSTU no se encontró
Significa que se está usando el SDK sin agregar la referencia real a la DLL.

**Solución:**
No usar `using wgssSTU;` ni clases del SDK hasta agregar Interop.wgssSTU.dll al .csproj.

### Tablet o UsbDevices no existe
Significa que se inventó o se usó una clase que no existe en el proyecto actual.

**Solución:**
Revisar los ejemplos reales del SDK y no usar nombres de clases no confirmados.

### No se detecta la tableta
Verificar:
- Cable USB.
- Driver Wacom STU instalado.
- SDK Wacom STU instalado.
- DemoButtons funciona.
- Ejecutar el servicio como administrador si es necesario.

## Integración real con SDK de Wacom STU

### Pasos para habilitar la integración real:

1. **Instalar el Wacom STU SDK para Windows**
   - Descargar desde https://developer.wacom.com/
   - Requiere registro como desarrollador

2. **Buscar la DLL del SDK**
   
   Posibles rutas:
   - `C:\Program Files (x86)\Wacom STU SDK\`
   - `C:\Program Files (x86)\Wacom STU SDK\COM\`
   - `C:\Program Files (x86)\Wacom STU SDK\Samples\`
   - `C:\Program Files\Wacom STU SDK\`
   
   Archivos a buscar:
   - `Interop.wgssSTU.dll`
   - `wgssSTU.dll`

3. **Copiar la DLL al proyecto**
   
   Crear carpeta:
   ```
   signature-service/libs/Wacom/
   ```
   
   Copiar la DLL a esa carpeta.

4. **Agregar referencia al .csproj**
   
   Agregar a `signature-service.csproj`:
   ```xml
   <ItemGroup>
     <Reference Include="Interop.wgssSTU">
       <HintPath>libs\Wacom\Interop.wgssSTU.dll</HintPath>
       <Private>true</Private>
     </Reference>
   </ItemGroup>
   ```

5. **Verificar si se requiere x86**
   
   Si el SDK requiere x86, agregar:
   ```xml
   <PropertyGroup>
     <PlatformTarget>x86</PlatformTarget>
   </PropertyGroup>
   ```
   
   Solo agregar si es necesario según la documentación del SDK.

6. **Crear WacomStuSignatureProvider**
   
   Crear `Providers/WacomStuSignatureProvider.cs` que implemente `IWacomSignatureProvider`.
   
   Reemplazar en `Program.cs`:
   ```csharp
   builder.Services.AddSingleton<IWacomSignatureProvider, WacomStuSignatureProvider>();
   ```

7. **Revisar ejemplos reales del SDK**
   
   No usar nombres de clases sin confirmar. Revisar:
   - DemoButtons
   - Documentación oficial del SDK
   - Object Browser de Visual Studio

## Arquitectura del servicio

```
signature-service/
├── Providers/
│   ├── IWacomSignatureProvider.cs       (Interfaz)
│   └── WacomSignatureProviderPlaceholder.cs  (Placeholder actual)
├── Models/
│   ├── SignatureStatusResponse.cs
│   ├── SignatureActionResponse.cs
│   ├── SignatureSaveResponse.cs
│   └── SignaturePenPointMessage.cs
├── Program.cs                            (Endpoints y WebSocket)
├── signature-service.csproj              (Configuración del proyecto)
└── README.md                             (Esta documentación)
```

## Próxima etapa

Reemplazar `WacomSignatureProviderPlaceholder` por `WacomStuSignatureProvider` cuando el SDK esté correctamente instalado y referenciado.

## Seguridad

- El servicio escucha solo en `localhost` (127.0.0.1)
- No se expone a internet ni a la red pública
- CORS configurado solo para `http://localhost:3000` y `http://localhost:3001`
- No almacena ni transmite información sensible innecesaria
