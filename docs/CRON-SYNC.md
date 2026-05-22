# Sincronización Mercado Público

Sistema completo de sincronización con la API de Mercado Público.

## Variables de Entorno Requeridas

```env
# API Mercado Público
MERCADO_PUBLICO_TICKET=tu_ticket_aqui
MERCADO_PUBLICO_CODIGO_ORGANISMO=7374
```

## Scripts Disponibles

| Comando                  | Descripción                                         |
| ------------------------ | --------------------------------------------------- |
| `npm run sync:historico` | Sincronización histórica inicial (01-01-2025 → hoy) |
| `npm run sync:diario`    | Sincronización del día actual                       |
| `npm run sync:now`       | Sincronización rápida manual                        |
| `npm run cron:start`     | Inicia cron cada 15 minutos                         |
| `npm run cron:run`       | Inicia cron + ejecución inmediata                   |

## Sincronización Histórica (Primera vez)

Ejecutar **una sola vez** para poblar la base de datos histórica:

```bash
npm run sync:historico
```

Este script:

- Itera día por día desde 01-01-2025
- Sincroniza todas las licitaciones del organismo
- Sincroniza todas las órdenes de compra por fecha
- Sincroniza todos los items de cada OC
- Guarda progreso para reanudación si falla
- Calcula consumo de cada licitación

**Nota:** Este proceso puede tomar varios minutos dependiendo del volumen de datos.

## Sincronización Diaria (Cronjob)

Para mantener los datos actualizados:

```bash
npm run cron:start
```

El cron ejecuta `sync-diario.js` cada 15 minutos:

- Sincroniza licitaciones nuevas/actualizadas
- Sincroniza OC del día actual
- Actualiza estados y consumo

## Datos Sincronizados

- **Licitaciones** del organismo con todos sus campos
- **Items de licitación** con adjudicaciones
- **Órdenes de Compra** con todos los estados (4-15)
- **Items de OC** con especificaciones y montos
- **Relaciones** OC ↔ Licitación via `codigoLicitacion`
- **Cálculo de consumo** automático

## Opciones de Ejecución

### Opción 1: Vercel Cron (Producción)

Si despliegas en Vercel, el cron job se configura automáticamente con `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-mercado-publico",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Opción 2: Node Cron (Desarrollo/Servidor propio)

Ejecutar el proceso de cron en segundo plano:

```bash
# Instalar dependencias
npm install

# Iniciar cron (mantiene proceso activo)
npm run cron:start

# Iniciar cron con ejecución inmediata
npm run cron:run
```

### Opción 3: Tarea Programada de Windows

1. Abrir "Programador de tareas" de Windows
2. Crear tarea básica
3. Configurar:
   - **Trigger**: Cada 5 minutos
   - **Acción**: Iniciar programa
   - **Programa**: `node`
   - **Argumentos**: `scripts/sync-once.js`
   - **Iniciar en**: Ruta del proyecto

### Opción 4: PM2 (Recomendado para producción)

```bash
# Instalar PM2
npm install -g pm2

# Iniciar cron como servicio
pm2 start scripts/cron-sync.js --name "sync-mp"

# Ver logs
pm2 logs sync-mp

# Guardar para reinicio automático
pm2 save
pm2 startup
```

## Sincronización Manual

Para ejecutar una sincronización manual:

```bash
# Desde línea de comandos (requiere servidor corriendo)
npm run sync:now

# O llamar directamente a la API
curl -X POST http://localhost:3000/api/cron/sync-mercado-publico \
  -H "x-cron-secret: tu_clave_secreta"
```

## API Endpoints

### GET /api/cron/sync-mercado-publico

Obtiene el estado de la última sincronización.

**Respuesta:**

```json
{
  "success": true,
  "lastSync": "2026-05-11T20:30:00.000Z",
  "totalLicitaciones": 45,
  "totalOrdenes": 234,
  "alertasActivas": 3
}
```

### POST /api/cron/sync-mercado-publico

Ejecuta la sincronización.

**Headers requeridos:**

- `x-cron-secret`: Clave secreta configurada en CRON_SECRET

**Respuesta:**

```json
{
  "success": true,
  "synced": 45,
  "errors": 0,
  "duration": "12345ms",
  "timestamp": "2026-05-11T20:35:00.000Z"
}
```

## Flujo de Sincronización

```
1. Consulta API Mercado Público (licitaciones adjudicadas del organismo)
   ↓
2. Por cada licitación:
   a. Obtiene detalle completo
   b. Crea/actualiza registro en BD (LicitacionMP)
   c. Sincroniza items de la licitación (ItemLicitacionMP)
   ↓
3. Por cada licitación:
   a. Consulta órdenes de compra asociadas
   b. Por cada OC:
      - Obtiene detalle completo
      - Crea/actualiza registro (OrdenCompraMP)
      - Sincroniza items (ItemOrdenCompraMP)
   ↓
4. Calcula consumo total de cada licitación
   ↓
5. Genera alertas si supera umbrales (50%, 75%, 90%)
```

## Logs

Los logs del cron se muestran en consola con el prefijo `[SYNC]`:

```
[SYNC] Iniciando sincronización de licitaciones...
[SYNC] Encontradas 45 licitaciones
[SYNC] Sincronizada: 2080-198-LQ24
[SYNC] Sincronizada: 2080-262-LP25
...
[SYNC] Completado. Sincronizadas: 45, Errores: 0
```

## Solución de Problemas

### Error: "API de Mercado Público no configurada"

- Verificar que `MERCADO_PUBLICO_TICKET` esté configurado en `.env`

### Error: "No autorizado" al llamar al endpoint

- Verificar que `CRON_SECRET` esté configurado
- Incluir header `x-cron-secret` en la petición

### Sincronización muy lenta

- La API de Mercado Público tiene rate limiting
- Considerar aumentar el intervalo del cron si hay muchas licitaciones
