# Manual de Uso — API Mercado Público para Sincronización de Licitaciones y Órdenes de Compra

## 1. Objetivo del manual

Este manual describe el uso de la API de Mercado Público implementada en el script de sincronización diaria del proyecto. El proceso tiene como finalidad consultar información desde Mercado Público, extraer licitaciones de un organismo específico, obtener sus detalles, rescatar órdenes de compra del día, sincronizar sus respectivos ítems y actualizar el consumo asociado a cada licitación.

El script está diseñado para ejecutarse de forma programada, por ejemplo mediante un cronjob o tarea programada, idealmente cada 5 a 15 minutos según la necesidad del sistema.

---

## 2. Alcance del proceso

El proceso de sincronización realiza las siguientes acciones principales:

1. Consulta licitaciones asociadas a un organismo comprador.
2. Obtiene el detalle completo de cada licitación.
3. Crea o actualiza registros de licitaciones en la base de datos.
4. Sincroniza los ítems asociados a cada licitación.
5. Consulta órdenes de compra emitidas durante el día.
6. Obtiene el detalle completo de cada orden de compra.
7. Relaciona las órdenes de compra con su licitación correspondiente, cuando existe código de licitación.
8. Crea o actualiza órdenes de compra en la base de datos.
9. Elimina y vuelve a insertar los ítems de cada orden de compra para mantenerlos actualizados.
10. Calcula el consumo de cada licitación en base a las órdenes aceptadas o con recepción conforme.

---

## 3. Requisitos previos

Antes de ejecutar el proceso, el proyecto debe contar con:

- Node.js instalado.
- Dependencias del proyecto instaladas mediante `npm install`.
- Archivo `.env` configurado correctamente.
- Base de datos disponible y conectada mediante Prisma.
- Modelos Prisma existentes para licitaciones, órdenes de compra e ítems.
- Ticket válido de Mercado Público.
- Código del organismo comprador a consultar.

---

## 4. Variables de entorno requeridas

El script utiliza variables de entorno cargadas con `dotenv`.

### 4.1. `MERCADO_PUBLICO_TICKET`

Ticket o credencial requerida para consultar la API de Mercado Público.

```env
MERCADO_PUBLICO_TICKET=TU_TICKET_AQUI
```

Si esta variable no está definida, el proceso se detiene y muestra el siguiente error:

```txt
ERROR: Falta MERCADO_PUBLICO_TICKET
```

### 4.2. `MERCADO_PUBLICO_CODIGO_ORGANISMO`

Código del organismo comprador que se desea consultar.

```env
MERCADO_PUBLICO_CODIGO_ORGANISMO=7374
```

Si esta variable no existe, el script utiliza por defecto el código:

```txt
7374
```

---

## 5. URL base de la API

El script utiliza la siguiente URL base para realizar las consultas a Mercado Público:

```txt
https://api.mercadopublico.cl/servicios/v1/publico
```

A partir de esta URL se construyen las rutas para consultar licitaciones y órdenes de compra.

---

## 6. Configuración interna del script

El script define algunos parámetros importantes para controlar la sincronización.

```js
const API_BASE_URL = "https://api.mercadopublico.cl/servicios/v1/publico"
const API_TICKET = process.env.MERCADO_PUBLICO_TICKET
const CODIGO_ORGANISMO = process.env.MERCADO_PUBLICO_CODIGO_ORGANISMO || "7374"

const DELAY_BETWEEN_REQUESTS = 300
const MAX_RETRIES = 3
const RETRY_DELAY = 1500
```

### Descripción de parámetros

| Parámetro | Descripción |
|---|---|
| `API_BASE_URL` | URL base de la API pública de Mercado Público. |
| `API_TICKET` | Ticket de autenticación para realizar consultas. |
| `CODIGO_ORGANISMO` | Código del organismo comprador que se consulta. |
| `DELAY_BETWEEN_REQUESTS` | Pausa entre solicitudes, definida en 300 milisegundos. |
| `MAX_RETRIES` | Cantidad máxima de reintentos por petición fallida. |
| `RETRY_DELAY` | Tiempo base de espera antes de reintentar una solicitud. |

---

## 7. Advertencia importante sobre sincronización persistente

En el archivo entregado existe una función que deshabilita la sincronización persistente:

```js
const isPersistentMercadoPublicoSyncDisabled = () => true
```

Como esta función retorna `true`, el script se detiene al inicio y muestra el mensaje:

```txt
Sincronizacion deshabilitada: los datos de Mercado Publico se consultan en linea y no se almacenan.
```

Luego finaliza con:

```js
process.exit(1)
```

### Cómo habilitar la sincronización

Para permitir que el script ejecute la sincronización y guarde datos en la base de datos, se debe cambiar la función a:

```js
const isPersistentMercadoPublicoSyncDisabled = () => false
```

También se puede eliminar este bloqueo si el sistema debe funcionar siempre en modo persistente.

---

## 8. Formato de fecha utilizado por la API

Para consultar órdenes de compra del día, el script convierte la fecha actual al formato requerido por la API:

```txt
DDMMYYYY
```

Ejemplo:

```txt
26052026
```

La función encargada de esto es:

```js
const formatDateForAPI = (date) => {
  const d = String(date.getDate()).padStart(2, "0")
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const y = date.getFullYear()
  return `${d}${m}${y}`
}
```

---

## 9. Manejo de peticiones HTTPS

El script realiza las peticiones utilizando el módulo nativo `https` de Node.js.

La función principal para consumir la API es:

```js
fetchJSON(url, retries = MAX_RETRIES)
```

### Funcionalidades de `fetchJSON`

- Ejecuta una petición `GET`.
- Usa timeout de 30 segundos.
- Convierte la respuesta a JSON.
- Maneja errores de conexión.
- Maneja errores al parsear JSON.
- Reintenta la solicitud si falla.
- Usa espera progresiva entre reintentos.

### Errores controlados

La función puede controlar errores como:

- Error de conexión.
- Timeout.
- JSON inválido.
- Falla final luego de superar los reintentos.

---

## 10. Endpoints utilizados

### 10.1. Consultar licitaciones por organismo

Permite obtener el listado de licitaciones asociadas a un organismo comprador.

```txt
GET /licitaciones.json?CodigoOrganismo={CODIGO_ORGANISMO}&ticket={API_TICKET}
```

Ejemplo construido por el script:

```txt
https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?CodigoOrganismo=7374&ticket=TU_TICKET
```

### 10.2. Consultar detalle de una licitación

Permite obtener el detalle completo de una licitación específica mediante su código externo.

```txt
GET /licitaciones.json?codigo={CODIGO_LICITACION}&ticket={API_TICKET}
```

Ejemplo:

```txt
https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?codigo=1234-56-LQ26&ticket=TU_TICKET
```

### 10.3. Consultar órdenes de compra del día

Permite obtener órdenes de compra emitidas en una fecha determinada para el organismo configurado.

```txt
GET /ordenesdecompra.json?fecha={DDMMYYYY}&CodigoOrganismo={CODIGO_ORGANISMO}&ticket={API_TICKET}
```

Ejemplo:

```txt
https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json?fecha=26052026&CodigoOrganismo=7374&ticket=TU_TICKET
```

### 10.4. Consultar detalle de una orden de compra

Permite obtener el detalle completo de una orden de compra específica.

```txt
GET /ordenesdecompra.json?codigo={CODIGO_OC}&ticket={API_TICKET}
```

Ejemplo:

```txt
https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json?codigo=1234-567-SE26&ticket=TU_TICKET
```

---

## 11. Flujo general de sincronización

La función principal del proceso es:

```js
runDailySync()
```

Esta función ejecuta el flujo completo en el siguiente orden:

1. Valida que exista `MERCADO_PUBLICO_TICKET`.
2. Ejecuta la sincronización de licitaciones.
3. Ejecuta la sincronización de órdenes de compra del día.
4. Actualiza el consumo de licitaciones.
5. Muestra estadísticas finales.
6. Cierra la conexión de Prisma.

Representación del flujo:

```txt
Inicio
  ↓
Validar ticket
  ↓
Sincronizar licitaciones
  ↓
Sincronizar órdenes de compra del día
  ↓
Actualizar consumo de licitaciones
  ↓
Mostrar resumen
  ↓
Desconectar Prisma
Fin
```

---

## 12. Sincronización de licitaciones

La función encargada de este proceso es:

```js
syncLicitaciones()
```

### 12.1. Consulta inicial

Primero se consulta el listado de licitaciones del organismo:

```txt
/licitaciones.json?CodigoOrganismo={CODIGO_ORGANISMO}&ticket={API_TICKET}
```

Si no existe información en `data.Listado`, el script muestra:

```txt
Sin licitaciones nuevas
```

### 12.2. Consulta de detalle

Por cada licitación encontrada, se consulta el detalle completo usando:

```txt
/licitaciones.json?codigo={CodigoExterno}&ticket={API_TICKET}
```

El detalle se obtiene desde:

```js
detalleData.Listado?.[0]
```

### 12.3. Identificación de licitación existente

Antes de guardar, el sistema verifica si la licitación ya existe:

```js
prisma.licitacionMP.findUnique({
  where: { codigoExterno: licResumen.CodigoExterno }
})
```

Si existe, se actualiza.  
Si no existe, se crea.

### 12.4. Cálculo de monto adjudicado

El script calcula el monto adjudicado desde los ítems adjudicados de la licitación.

Primero calcula el monto neto:

```js
Cantidad * MontoUnitario
```

Luego agrega IVA del 19%:

```js
montoAdjudicado = Math.round(montoNeto * 1.19)
```

Este valor se almacena en el campo:

```txt
montoAdjudicado
```

### 12.5. Datos principales guardados de la licitación

El proceso guarda o actualiza información como:

| Campo interno | Dato desde Mercado Público |
|---|---|
| `codigoExterno` | `CodigoExterno` |
| `nombre` | `Nombre` |
| `descripcion` | `Descripcion` |
| `estado` | `Estado` |
| `codigoEstado` | `CodigoEstado` |
| `tipo` | `Tipo` |
| `codigoTipo` | `CodigoTipo` |
| `moneda` | `Moneda` |
| `etapas` | `Etapas` |
| `modalidad` | `Modalidad` |
| `montoEstimado` | `MontoEstimado` |
| `montoAdjudicado` | Calculado desde ítems adjudicados con IVA |
| `tiempoDuracion` | `TiempoDuracionContrato` |
| `unidadTiempoDuracion` | `UnidadTiempoDuracion` |

### 12.6. Fechas de la licitación

El script guarda las fechas disponibles dentro del objeto `Fechas`:

| Campo interno | Dato API |
|---|---|
| `fechaCreacion` | `Fechas.FechaCreacion` |
| `fechaPublicacion` | `Fechas.FechaPublicacion` |
| `fechaCierre` | `Fechas.FechaCierre` |
| `fechaAdjudicacion` | `Fechas.FechaAdjudicacion` |
| `fechaInicio` | `Fechas.FechaInicio` |
| `fechaFinal` | `Fechas.FechaFinal` |

Cuando una fecha no viene informada, se guarda como `null`.

### 12.7. Datos de adjudicación

El script guarda información desde el objeto `Adjudicacion`:

| Campo interno | Dato API |
|---|---|
| `adjudicacionTipo` | `Adjudicacion.Tipo` |
| `adjudicacionNumero` | `Adjudicacion.Numero` |
| `adjudicacionNumOferentes` | `Adjudicacion.NumeroOferentes` |
| `adjudicacionUrlActa` | `Adjudicacion.UrlActa` |

### 12.8. Datos del comprador

El script guarda datos del comprador desde `Comprador`:

| Campo interno | Dato API |
|---|---|
| `codigoOrganismo` | `Comprador.CodigoOrganismo` |
| `nombreOrganismo` | `Comprador.NombreOrganismo` |
| `rutUnidad` | `Comprador.RutUnidad` |
| `codigoUnidad` | `Comprador.CodigoUnidad` |
| `nombreUnidad` | `Comprador.NombreUnidad` |
| `direccionUnidad` | `Comprador.DireccionUnidad` |
| `comunaUnidad` | `Comprador.ComunaUnidad` |
| `regionUnidad` | `Comprador.RegionUnidad` |
| `nombreUsuario` | `Comprador.NombreUsuario` |
| `cargoUsuario` | `Comprador.CargoUsuario` |
| `requirente` | `Comprador.NombreUnidad` o `"Sin asignar"` |

---

## 13. Sincronización de ítems de licitación

Después de crear o actualizar la licitación, el script revisa si existen ítems en:

```js
licData.Items?.Listado
```

Por cada ítem, se verifica si ya existe un registro con:

```js
licitacionMPId
correlativo
```

Si existe, se actualiza.  
Si no existe, se crea.

### 13.1. Datos guardados por ítem de licitación

| Campo interno | Dato API |
|---|---|
| `licitacionMPId` | ID interno de la licitación |
| `correlativo` | `Correlativo` |
| `codigoProducto` | `CodigoProducto` |
| `codigoCategoria` | `CodigoCategoria` |
| `categoria` | `Categoria` |
| `nombreProducto` | `NombreProducto` |
| `descripcion` | `Descripcion` |
| `unidadMedida` | `UnidadMedida` |
| `cantidadTotal` | `Cantidad` |
| `cantidadAdjudicada` | `Adjudicacion.Cantidad` |
| `montoUnitario` | `Adjudicacion.MontoUnitario` |
| `montoTotal` | `Cantidad adjudicada * Monto unitario` |
| `rutProveedor` | `Adjudicacion.RutProveedor` |
| `nombreProveedor` | `Adjudicacion.NombreProveedor` |

---

## 14. Sincronización de órdenes de compra del día

La función encargada es:

```js
syncOrdenesCompraHoy()
```

### 14.1. Fecha usada para la consulta

El script toma la fecha actual:

```js
const hoy = new Date()
```

Luego la transforma a formato `DDMMYYYY`:

```js
const fechaAPI = formatDateForAPI(hoy)
```

### 14.2. Consulta de órdenes

La consulta se realiza usando:

```txt
/ordenesdecompra.json?fecha={fechaAPI}&CodigoOrganismo={CODIGO_ORGANISMO}&ticket={API_TICKET}
```

Si no se encuentran órdenes en `data.Listado`, el script muestra:

```txt
Sin órdenes de compra hoy
```

### 14.3. Consulta de detalle de orden de compra

Por cada orden encontrada, se consulta su detalle completo mediante:

```txt
/ordenesdecompra.json?codigo={CodigoOC}&ticket={API_TICKET}
```

El detalle se obtiene desde:

```js
detalleData.Listado?.[0]
```

### 14.4. Relación con licitación

Si la orden de compra contiene `CodigoLicitacion`, el sistema busca la licitación asociada en la tabla `licitacionMP`:

```js
prisma.licitacionMP.findUnique({
  where: { codigoExterno: ocData.CodigoLicitacion }
})
```

Si existe coincidencia, se guarda el ID interno en:

```txt
licitacionMPId
```

Si no existe, se guarda como `null`.

---

## 15. Datos guardados de órdenes de compra

El script crea o actualiza registros en `ordenCompraMP`.

### 15.1. Datos generales

| Campo interno | Dato API |
|---|---|
| `codigo` | `Codigo` |
| `codigoLicitacion` | `CodigoLicitacion` |
| `licitacionMPId` | ID interno relacionado |
| `nombre` | `Nombre` |
| `descripcion` | `Descripcion` |
| `codigoEstado` | `CodigoEstado` |
| `estado` | `Estado` |
| `codigoTipo` | `CodigoTipo` |
| `tipo` | `Tipo` |
| `tipoMoneda` | `TipoMoneda` |

### 15.2. Estado del proveedor

| Campo interno | Dato API |
|---|---|
| `codigoEstadoProveedor` | `CodigoEstadoProveedor` |
| `estadoProveedor` | `EstadoProveedor` |

### 15.3. Montos de la orden

| Campo interno | Dato API |
|---|---|
| `descuentos` | `Descuentos` |
| `cargos` | `Cargos` |
| `totalNeto` | `TotalNeto` |
| `porcentajeIva` | `PorcentajeIva` |
| `impuestos` | `Impuestos` |
| `total` | `Total` |

### 15.4. Fechas de la orden

| Campo interno | Dato API |
|---|---|
| `fechaCreacion` | `Fechas.FechaCreacion` o fecha actual |
| `fechaEnvio` | `Fechas.FechaEnvio` |
| `fechaAceptacion` | `Fechas.FechaAceptacion` |
| `fechaCancelacion` | `Fechas.FechaCancelacion` |
| `fechaUltimaModificacion` | `Fechas.FechaUltimaModificacion` |

### 15.5. Condiciones comerciales

| Campo interno | Dato API |
|---|---|
| `financiamiento` | `Financiamiento` |
| `tipoDespacho` | `TipoDespacho` |
| `formaPago` | `FormaPago` |

### 15.6. Datos del comprador

| Campo interno | Dato API |
|---|---|
| `codigoOrganismo` | `Comprador.CodigoOrganismo` |
| `nombreOrganismo` | `Comprador.NombreOrganismo` |
| `rutUnidad` | `Comprador.RutUnidad` |
| `nombreUnidad` | `Comprador.NombreUnidad` |
| `direccionUnidad` | `Comprador.DireccionUnidad` |
| `comunaUnidad` | `Comprador.ComunaUnidad` |
| `nombreContacto` | `Comprador.NombreContacto` |
| `cargoContacto` | `Comprador.CargoContacto` |

### 15.7. Datos del proveedor

| Campo interno | Dato API |
|---|---|
| `codigoProveedor` | `Proveedor.Codigo` |
| `rutProveedor` | `Proveedor.RutSucursal` |
| `nombreProveedor` | `Proveedor.Nombre` |
| `direccionProveedor` | `Proveedor.Direccion` |
| `comunaProveedor` | `Proveedor.Comuna` |
| `regionProveedor` | `Proveedor.Region` |

---

## 16. Sincronización de ítems de órdenes de compra

Cuando una orden de compra posee ítems en:

```js
ocData.Items?.Listado
```

el script realiza primero una eliminación completa de los ítems anteriores asociados a esa orden:

```js
prisma.itemOrdenCompraMP.deleteMany({
  where: { ordenCompraId: orden.id }
})
```

Luego vuelve a insertar todos los ítems actualizados.

### 16.1. Motivo de esta estrategia

Esta estrategia asegura que los ítems de la orden queden exactamente iguales a los datos más recientes entregados por Mercado Público, evitando duplicados o inconsistencias por modificaciones posteriores.

### 16.2. Datos guardados por ítem de orden de compra

| Campo interno | Dato API |
|---|---|
| `ordenCompraId` | ID interno de la orden de compra |
| `correlativo` | `Correlativo` |
| `codigoCategoria` | `CodigoCategoria` |
| `categoria` | `Categoria` |
| `codigoProducto` | `CodigoProducto` |
| `producto` | `Producto` |
| `especificacionComprador` | `EspecificacionComprador` |
| `especificacionProveedor` | `EspecificacionProveedor` |
| `cantidad` | `Cantidad` |
| `unidad` | `Unidad` |
| `moneda` | `Moneda` |
| `precioNeto` | `PrecioNeto` |
| `totalDescuentos` | `TotalDescuentos` |
| `totalCargos` | `TotalCargos` |
| `totalImpuestos` | `TotalImpuestos` |
| `total` | `Total` |

---

## 17. Actualización de consumo de licitaciones

La función encargada es:

```js
updateConsumoLicitaciones()
```

Esta función calcula cuánto se ha consumido de cada licitación según sus órdenes de compra asociadas.

### 17.1. Estados considerados

El script solo considera órdenes de compra con los siguientes estados:

```js
codigoEstado: { in: [6, 12] }
```

Según el comentario del código, estos estados corresponden a:

| Código | Estado considerado |
|---|---|
| `6` | Aceptada |
| `12` | Recepción Conforme |

### 17.2. Cálculo del monto consumido

El monto consumido se calcula sumando el total de las órdenes de compra válidas:

```js
const montoConsumido = lic.ordenesCompra.reduce((acc, oc) => acc + (oc.total || 0), 0)
```

### 17.3. Cálculo del porcentaje de consumo

Si la licitación posee monto adjudicado mayor a cero, se calcula:

```txt
porcentajeConsumo = (montoConsumido / montoAdjudicado) * 100
```

Si no existe monto adjudicado, el porcentaje queda en cero.

### 17.4. Campos actualizados

| Campo | Descripción |
|---|---|
| `montoConsumido` | Suma de órdenes de compra aceptadas o con recepción conforme. |
| `porcentajeConsumo` | Porcentaje consumido respecto al monto adjudicado. |

---

## 18. Estadísticas del proceso

El script mantiene estadísticas internas en el objeto `stats`.

```js
const stats = {
  licitacionesNuevas: 0,
  licitacionesActualizadas: 0,
  ordenesNuevas: 0,
  ordenesActualizadas: 0,
  itemsSincronizados: 0,
  errores: 0
}
```

### Descripción

| Estadística | Descripción |
|---|---|
| `licitacionesNuevas` | Cantidad de licitaciones creadas. |
| `licitacionesActualizadas` | Cantidad de licitaciones actualizadas. |
| `ordenesNuevas` | Cantidad de órdenes de compra creadas. |
| `ordenesActualizadas` | Cantidad de órdenes de compra actualizadas. |
| `itemsSincronizados` | Cantidad de ítems de órdenes de compra insertados. |
| `errores` | Cantidad de errores detectados durante la ejecución. |

---

## 19. Ejecución del proceso

El comentario inicial del script indica que debe ejecutarse con:

```bash
npm run sync:diario
```

Para que esto funcione, el archivo `package.json` debe tener un script similar a:

```json
{
  "scripts": {
    "sync:diario": "node ruta/del/script.js"
  }
}
```

Ejemplo:

```json
{
  "scripts": {
    "sync:diario": "node scripts/sync-mercado-publico-diario.js"
  }
}
```

---

## 20. Ejecución mediante tarea programada

El script está pensado para ejecutarse automáticamente cada 5 a 15 minutos.

### 20.1. Ejemplo con cron en Linux

Cada 15 minutos:

```cron
*/15 * * * * cd /ruta/del/proyecto && npm run sync:diario >> logs/sync-mercado-publico.log 2>&1
```

Cada 5 minutos:

```cron
*/5 * * * * cd /ruta/del/proyecto && npm run sync:diario >> logs/sync-mercado-publico.log 2>&1
```

### 20.2. Ejemplo en Windows con Programador de tareas

En Windows se puede crear una tarea programada que ejecute:

```bat
cd C:\ruta\del\proyecto
npm run sync:diario
```

También se puede crear un archivo `.bat`:

```bat
@echo off
cd C:\ruta\del\proyecto
npm run sync:diario >> logs\sync-mercado-publico.log 2>&1
```

---

## 21. Resultado esperado en consola

Al iniciar, el script imprime un encabezado similar a:

```txt
═══════════════════════════════════════════
  SINCRONIZACIÓN DIARIA - MERCADO PÚBLICO
═══════════════════════════════════════════
Fecha: 26-05-2026, 10:30:00
───────────────────────────────────────────
```

Durante el proceso muestra avances como:

```txt
📋 Sincronizando licitaciones...
📦 Sincronizando órdenes de compra del día...
📊 Actualizando consumo...
```

Al finalizar, muestra un resumen:

```txt
✓ SINCRONIZACIÓN COMPLETADA
  Licitaciones: +0 | ~10
  OC: +2 | ~4
  Items: 35
  Errores: 0
  Duración: 12s
```

---

## 22. Consideraciones de seguridad

### 22.1. No exponer el ticket

El valor de `MERCADO_PUBLICO_TICKET` no debe quedar escrito directamente en el código fuente ni subirse a repositorios públicos.

Debe mantenerse en el archivo `.env`.

### 22.2. No registrar información sensible innecesaria

El log del proceso debe evitar imprimir credenciales, tickets o URLs completas con ticket incluido.

### 22.3. Controlar acceso al servidor

Si el proceso se ejecuta en un servidor, solo usuarios autorizados deberían poder modificar:

- Archivo `.env`.
- Script de sincronización.
- Configuración de cronjob o tarea programada.
- Base de datos.

---

## 23. Consideraciones de rendimiento

El script incluye una pausa de 300 milisegundos entre solicitudes para evitar sobrecargar la API:

```js
await delay(DELAY_BETWEEN_REQUESTS)
```

También incluye reintentos automáticos ante errores temporales.

### Recomendaciones

- Mantener un intervalo prudente entre ejecuciones.
- Evitar ejecutar varias instancias del script al mismo tiempo.
- Registrar logs para revisar errores.
- Supervisar la duración de cada sincronización.
- Validar que la base de datos tenga índices en campos como `codigoExterno`, `codigo`, `licitacionMPId` y `ordenCompraId`.

---

## 24. Manejo de errores

El script captura errores en distintos niveles.

### 24.1. Error general por falta de ticket

Si falta el ticket, el proceso se detiene inmediatamente:

```txt
ERROR: Falta MERCADO_PUBLICO_TICKET
```

### 24.2. Error en sincronización de licitaciones

Si ocurre un error general en licitaciones, se registra:

```txt
✗ Error: {mensaje}
```

### 24.3. Error en sincronización de órdenes de compra

Si ocurre un error general en órdenes de compra, se registra:

```txt
✗ Error: {mensaje}
```

### 24.4. Error por registro individual

Si falla una licitación o una orden específica, el script aumenta el contador:

```js
stats.errores++
```

y continúa con el siguiente registro.

---

## 25. Tablas o modelos utilizados

Según el script, los modelos Prisma utilizados son:

| Modelo | Uso |
|---|---|
| `licitacionMP` | Guarda licitaciones de Mercado Público. |
| `itemLicitacionMP` | Guarda ítems asociados a licitaciones. |
| `ordenCompraMP` | Guarda órdenes de compra. |
| `itemOrdenCompraMP` | Guarda ítems asociados a órdenes de compra. |

---

## 26. Relaciones principales

### 26.1. Licitación e ítems

Una licitación puede tener muchos ítems:

```txt
licitacionMP → itemLicitacionMP
```

La relación se realiza mediante:

```txt
licitacionMPId
```

### 26.2. Licitación y órdenes de compra

Una licitación puede tener muchas órdenes de compra:

```txt
licitacionMP → ordenCompraMP
```

La relación se realiza mediante:

```txt
licitacionMPId
```

También se mantiene el código externo:

```txt
codigoLicitacion
```

### 26.3. Orden de compra e ítems

Una orden de compra puede tener muchos ítems:

```txt
ordenCompraMP → itemOrdenCompraMP
```

La relación se realiza mediante:

```txt
ordenCompraId
```

---

## 27. Buenas prácticas recomendadas

1. Mantener el ticket en `.env` y no en el código.
2. Revisar periódicamente los logs de sincronización.
3. No ejecutar sincronizaciones simultáneas.
4. Usar índices únicos en:
   - `licitacionMP.codigoExterno`
   - `ordenCompraMP.codigo`
5. Validar que los campos de Prisma coincidan con la base de datos.
6. Mantener controlado el intervalo de ejecución.
7. Revisar el contador de errores después de cada ejecución.
8. Guardar fecha de última sincronización si se requiere trazabilidad adicional.
9. Registrar errores individuales con más detalle si el sistema pasa a producción.
10. Probar la consulta manualmente cuando una orden o licitación no aparezca en el sistema.

---

## 28. Problemas frecuentes

### 28.1. El proceso no sincroniza nada

Posible causa:

```js
const isPersistentMercadoPublicoSyncDisabled = () => true
```

Solución:

```js
const isPersistentMercadoPublicoSyncDisabled = () => false
```

### 28.2. Falta ticket de Mercado Público

Verificar que exista en `.env`:

```env
MERCADO_PUBLICO_TICKET=TU_TICKET_AQUI
```

### 28.3. No aparecen órdenes de compra

Verificar:

- Que la fecha enviada esté en formato `DDMMYYYY`.
- Que el organismo tenga órdenes emitidas ese día.
- Que `CODIGO_ORGANISMO` sea correcto.
- Que el ticket esté activo.

### 28.4. Las órdenes no se relacionan con la licitación

Puede ocurrir si:

- La orden no trae `CodigoLicitacion`.
- La licitación aún no existe en la base de datos.
- El código externo no coincide con `codigoExterno`.

### 28.5. El monto consumido aparece en cero

Verificar:

- Que existan órdenes asociadas a la licitación.
- Que las órdenes tengan `codigoEstado` igual a `6` o `12`.
- Que las órdenes tengan campo `total` mayor a cero.
- Que la relación `licitacionMPId` esté correctamente asignada.

---

## 29. Checklist antes de ejecutar

Antes de ejecutar la sincronización, revisar:

- [ ] El archivo `.env` contiene `MERCADO_PUBLICO_TICKET`.
- [ ] El archivo `.env` contiene el código correcto del organismo o se usará `7374`.
- [ ] Prisma conecta correctamente con la base de datos.
- [ ] Existen las tablas requeridas.
- [ ] La sincronización persistente está habilitada.
- [ ] El comando `npm run sync:diario` existe en `package.json`.
- [ ] No hay otra instancia del proceso ejecutándose.
- [ ] Existe una carpeta de logs si se redirige la salida.
- [ ] El servidor tiene conexión a internet.
- [ ] El ticket de Mercado Público está vigente.

---

## 30. Resumen técnico del flujo

```txt
runDailySync()
├── Validar MERCADO_PUBLICO_TICKET
├── syncLicitaciones()
│   ├── Consultar licitaciones por organismo
│   ├── Consultar detalle por cada licitación
│   ├── Calcular monto adjudicado con IVA
│   ├── Crear o actualizar licitación
│   └── Crear o actualizar ítems de licitación
├── syncOrdenesCompraHoy()
│   ├── Formatear fecha actual DDMMYYYY
│   ├── Consultar órdenes de compra del día
│   ├── Consultar detalle por cada orden
│   ├── Relacionar con licitación si existe
│   ├── Crear o actualizar orden de compra
│   └── Eliminar y recrear ítems de orden
├── updateConsumoLicitaciones()
│   ├── Buscar órdenes con estado 6 o 12
│   ├── Sumar total de órdenes
│   ├── Calcular porcentaje de consumo
│   └── Actualizar licitación
└── Desconectar Prisma
```

---

## 31. Conclusión

La integración implementada permite mantener actualizada la información de Mercado Público dentro del sistema local, sincronizando licitaciones, órdenes de compra e ítems asociados. Además, calcula automáticamente el consumo de cada licitación considerando las órdenes de compra aceptadas o con recepción conforme.

El punto más importante a revisar antes de usar el script es que actualmente la sincronización persistente se encuentra deshabilitada mediante una función que retorna `true`. Para que el proceso guarde información en la base de datos, esta condición debe modificarse o eliminarse según la arquitectura final del sistema.
