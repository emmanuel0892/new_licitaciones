# Plan de trabajo — Valor agregado HRR Licitaciones

> Objetivo: elevar el sistema de **gestor de procesos** a **plataforma de inteligencia de abastecimiento**, sin afectar la funcionalidad existente.

## Principio rector: aditivo, no destructivo

Todas las fases respetan estas reglas para garantizar que **nada de lo actual se rompa**:

- **No se modifican** Server Actions ni firmas de funciones existentes. Se crean archivos nuevos en `src/actions/`, `src/lib/`, `scripts/`.
- **Base de datos solo aditiva**: nuevas tablas y/o columnas `NULL`/con default. Nunca se renombra, elimina ni cambia el tipo de columnas existentes. Migraciones con `prisma migrate dev` revisables.
- **Feature flags** por variable de entorno (`.env`) para activar/desactivar cada módulo nuevo sin redeploy de lo existente.
- **Reutilización**: se apoya en lo ya construido (`getDashboardStats`, `getAlertasDiasSugeridos`, `HistorialLicitacion`, `AlertaConsumo`, `scripts/cron-sync.js`).
- Validación con **Zod** en cada nueva entrada y permisos vía el sistema de roles ya existente (`src/lib/permissions.js`).

---

## Fase 0 — Base común (habilitadores) · ✅ Realizado

- [x] `src/lib/featureFlags.js` (flags por env, todo apagado por defecto)
- [x] `src/lib/email.js` (`enviarCorreo` + plantilla `renderEmailLayout`, con `nodemailer`)
- [x] `src/lib/validations/notificacion.js` (esquemas Zod)
- [x] Dependencia `nodemailer` instalada

**Objetivo:** preparar la infraestructura compartida que usarán las demás fases.

| Ítem | Detalle |y lo
|------|---------|
| Archivos nuevos | `src/lib/email.js` (cliente de correo), `src/lib/featureFlags.js`, `src/lib/validations/notificacion.js` |
| BD (aditivo) | — |
| Dependencias | `nodemailer` (envío SMTP) |
| Entregable | Función `enviarCorreo({ to, subject, html })` reutilizable + lectura de flags |
| Criterio de aceptación | Envío de correo de prueba OK; flags leen `.env` sin romper si faltan |
| Riesgo / mitigación | Credenciales SMTP institucionales → usar `.env`, no hardcodear; fallar en silencio con log si el flag está off |
| Estimación | 0.5–1 día |

---

## Fase 1 — Notificaciones proactivas por correo ⭐ · ✅ Código realizado (pendiente puesta en marcha)

- [x] Modelos Prisma aditivos `NotificacionEnviada` y `PreferenciaNotificacion` (tablas independientes, sin FK a modelos existentes)
- [x] `src/lib/notificaciones.js` (cálculo global de plazos + digest + idempotencia diaria)
- [x] `src/actions/notificaciones.js` (preferencias del usuario, validadas con Zod)
- [x] Endpoint protegido `src/app/api/cron/notificaciones-plazos/route.js` (mismo esquema de `CRON_SECRET`)
- [x] `scripts/cron-sync.js`: nueva tarea diaria 08:00 **aditiva** (no altera la de sync)
- [ ] **Pendiente para producción:** aplicar migración (`prisma migrate`/`db push`) para crear las 2 tablas
- [ ] **Pendiente para producción:** configurar SMTP en `.env` y `FEATURE_NOTIFICACIONES_EMAIL=true`
- [ ] **Pendiente para producción:** `APP_BASE_URL` y `CRON_SECRET` en el entorno del cron

> Nota de diseño: en lugar de un script `node` autónomo (los helpers de plazos son ESM y muy extensos), el job se ejecuta vía endpoint Next, reutilizando `getDiasSugeridosProceso` sin duplicar lógica. El `cron-sync.js` lo invoca por `fetch`.

**Objetivo:** que un responsable se entere por correo de plazos por vencer/vencidos y de consumo crítico, aunque no entre al sistema. Reaprovecha `getAlertasDiasSugeridos` y `AlertaConsumo`.

| Ítem | Detalle |
|------|---------|
| Archivos nuevos | `scripts/notificaciones-plazos.js` (job), `src/lib/notificaciones.js` (lógica), `src/actions/notificaciones.js` (preferencias) |
| Modifica existente | Solo `scripts/cron-sync.js`: **agregar** una nueva tarea `cron.schedule` (no se altera la de sync) |
| BD (aditivo) | Tabla nueva `notificacion_enviada` (log idempotente: a quién, qué, cuándo) para no reenviar; tabla `preferencia_notificacion` (canal/umbral por usuario, opcional) |
| Disparadores | (a) paso por vencer/vencido — usa la consulta de `getAlertasDiasSugeridos`; (b) consumo cruza 50/75/90% — usa flags `alertaEnviada50/75/90` ya existentes en `LicitacionMP`; (c) asignación de licitación |
| Entregable | Correo diario/programado con resumen por usuario + correo puntual al cruzar umbral |
| Criterio de aceptación | No se envían duplicados; respeta preferencias; si flag off, no envía nada |
| Riesgo / mitigación | Spam de correos → agrupar en digest + idempotencia por `notificacion_enviada`; horario hábil configurable |
| Estimación | 2–3 días |

---

## Fase 2 — Dashboard de gestión / KPIs ⭐ · ✅ Realizado (operativo)

- [x] `src/actions/analytics.js` → `getIndicadoresGestion()` (solo lectura, sin cambios de BD)
- [x] `src/components/dashboard/IndicadoresContent.jsx` (KPIs con componentes nativos de AntD, sin dependencias extra)
- [x] **Los indicadores son ahora la pantalla de Inicio** (`/dashboard`): reemplazan el contenido anterior, manteniendo el nombre "Inicio" y el permiso `sidebar.inicio` existente
- [x] KPIs: resumen por estado, cumplimiento de plazos, carga por etapa (cuellos de botella), tendencia 6 meses, top requirentes, calidad (devoluciones/ediciones), montos del año
- [x] **Visibilidad:** los KPIs se filtran por usuario (Super Admin ve todo, el resto solo sus licitaciones), igual que el inicio anterior

**Objetivo:** convertir la pantalla de inicio (hoy 4 tarjetas + "Actividad Reciente" vacía) en un tablero de control, usando `HistorialLicitacion` (origen/destino + timestamps).

| Ítem | Detalle |
|------|---------|
| Archivos nuevos | `src/actions/analytics.js` (consultas de solo lectura), `src/components/dashboard/KpisPanel.jsx`, `src/components/dashboard/charts/*` |
| Modifica existente | `DashboardContent.jsx`: se **agregan** secciones nuevas debajo de lo actual (no se quita nada). Alternativa: nueva ruta `/dashboard/indicadores` para riesgo cero |
| BD (aditivo) | — (solo lecturas/agregaciones sobre tablas existentes) |
| Dependencias | Gráficos con `@ant-design/charts` o `antd` Progress/Statistic ya disponibles |
| KPIs | Tiempo de ciclo por etapa (cuellos de botella); % cumplimiento de `diasSugeridos`; devoluciones/ediciones; monto presupuestado vs adjudicado (ahorro); tendencia mensual |
| Entregable | Panel con filtros por rango de fechas, departamento y requirente |
| Criterio de aceptación | Cifras cuadran con los listados existentes; carga < 2s con datos reales |
| Riesgo / mitigación | Consultas pesadas → índices ya existen en FKs; cachear con `revalidate` y limitar rango por defecto |
| Estimación | 3–5 días |

---

## Fase 3 — Proyección de agotamiento de convenios · ⏳ Pendiente

**Objetivo:** anticipar el agotamiento de convenios marco para re-licitar a tiempo y evitar quiebre de stock clínico. Usa `montoConsumido`, `OrdenCompraMP` históricas.

| Ítem | Detalle |
|------|---------|
| Archivos nuevos | `src/lib/proyeccionConsumo.js`, columna calculada en la vista de `consumo/page.jsx` (componente nuevo) |
| Modifica existente | `consumo/page.jsx`: se **agrega** columna/indicador "Agotamiento estimado" (aditivo) |
| BD (aditivo) | Opcional: `proyeccion_consumo` (snapshot mensual) si se quiere histórico de la proyección |
| Lógica | Ritmo de consumo (regresión simple sobre OC por mes) → meses estimados hasta el 100% |
| Entregable | Semáforo + fecha estimada de agotamiento por convenio; se conecta a Fase 1 para avisar |
| Criterio de aceptación | Proyección coherente con consumo real; marca convenios en riesgo a < N meses |
| Riesgo / mitigación | Pocos datos → mostrar "insuficiente" en vez de proyección engañosa |
| Estimación | 2–3 días |

---

## Fase 4 — Expediente auditable exportable (Contraloría) · ⏳ Pendiente

**Objetivo:** exportar el expediente completo de una licitación (historial + documentos + firmas + tiempos) a un PDF único y listados a Excel. Usa `pdf-lib` y `xlsx` ya instalados.

| Ítem | Detalle |
|------|---------|
| Archivos nuevos | `src/lib/expedientePdf.js`, `src/lib/exportExcel.js`, `src/actions/exportaciones.js` |
| Modifica existente | Vistas de licitación: **botón** "Exportar expediente" (aditivo) |
| BD (aditivo) | — |
| Entregable | PDF con portada, línea de tiempo del `HistorialLicitacion`, documentos y firmas; export Excel de listados |
| Criterio de aceptación | PDF abre correctamente, incluye firmas y respeta permisos de acceso |
| Riesgo / mitigación | PDFs grandes → generar en streaming / limitar tamaño de adjuntos embebidos |
| Estimación | 3–4 días |

---

## Fase 5 — ~~Cierre de ciclo PAC ↔ Requerimiento ↔ OC~~ · ❌ Fuera de alcance

> El **PAC se gestiona en otra plataforma**, por lo que esta fase queda descartada de este sistema. Se mantiene el título solo como referencia histórica del análisis.

---

## Fase 6 — Firma electrónica avanzada (FirmaGob) — exploratoria · ⏳ Pendiente

**Objetivo:** dar validez legal plena a documentos, complementando la firma manuscrita Wacom actual (no la reemplaza).

| Ítem | Detalle |
|------|---------|
| Archivos nuevos | `src/lib/firmaGob.js`, acción `src/actions/firmaAvanzada.js` |
| Modifica existente | Flujo de firma: **opción adicional** "Firma avanzada" junto a la Wacom existente |
| BD (aditivo) | Columnas `NULL` para metadatos de firma avanzada en la tabla de firmas |
| Entregable | Integración con el servicio FirmaGob del Estado |
| Criterio de aceptación | La firma Wacom sigue funcionando igual; la avanzada es opt-in |
| Riesgo / mitigación | Requiere convenio/credenciales institucionales con FirmaGob → fase de viabilidad primero |
| Estimación | Spike 2 días + implementación a definir según viabilidad |

---

## Secuencia recomendada

```
Fase 0 (base) ✅
   └─► Fase 1 (correos) ✅ ──┐
   └─► Fase 2 (KPIs) ✅       ├─►  Fase 3 (proyección) ⏳
                             │
                             └─►  Fase 4 (expediente) ⏳ ──► Fase 6 (FirmaGob, viabilidad) ⏳

Fase 5 (ciclo PAC) ❌ fuera de alcance — se gestiona en otra plataforma
```

**Quick wins (primeras 2 semanas):** Fase 0 → Fase 1 → Fase 2 → ✅ **completadas**. Máximo impacto percibido, riesgo bajo, reutilizan datos y mecanismos ya existentes.

**Siguiente sugerido:** Fase 3 (proyección de agotamiento) o Fase 4 (expediente auditable).

## Garantías de no-regresión (todas las fases)

1. Rama por fase; nada se mezcla a `main` sin revisión.
2. Cada fase entra detrás de un **feature flag** apagado por defecto.
3. Migraciones de BD **solo aditivas** y revisadas antes de aplicar.
4. Checkpoint (commit) antes y después de cada fase.
5. Smoke test del flujo actual (login → crear → avanzar → firmar) tras cada fase.
