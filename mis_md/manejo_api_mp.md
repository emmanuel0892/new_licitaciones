# Instrucción para Agente IA — Sincronización Completa Mercado Público

## Contexto

Actualmente el proceso de sincronización solamente está consultando y almacenando las licitaciones adjudicadas desde la API de Mercado Público.

Sin embargo, NO se están sincronizando:

- Órdenes de Compra (OC)
- Ítems de las Órdenes de Compra
- Relación entre OC y Licitación

Esto provoca que la base de datos quede incompleta y no permita análisis posteriores de compras, adjudicaciones, montos, proveedores ni trazabilidad completa del proceso de compra pública.

---

# Objetivo

Modificar el proceso de sincronización para:

1. Obtener y almacenar TODAS las licitaciones del organismo.
2. Obtener y almacenar TODAS las órdenes de compra relacionadas.
3. Obtener y almacenar TODOS los ítems de cada orden de compra.
4. Relacionar correctamente:
   - Licitación ↔ Orden de Compra
   - Orden de Compra ↔ Ítems

---

# Organismo

```txt
CodigoOrganismo = 7374
```

---

# API Base

```txt
https://api.mercadopublico.cl/servicios/v1/publico
```

---

# Problema Actual

Actualmente el sistema realiza algo similar a:

```txt
GET /licitaciones.json?CodigoOrganismo=7374&estado=adjudicada
```

Esto solamente sincroniza licitaciones adjudicadas recientes y NO descarga:

- histórico completo
- órdenes de compra
- ítems de OC

---

# Requerimiento de Sincronización Histórica Inicial

Debe crearse un script de sincronización masiva inicial para poblar la base de datos histórica.

## Rango requerido

```txt
Desde: 01-01-2025
Hasta: fecha actual
```

## Consideraciones

La API de Mercado Público devuelve solamente información diaria en algunos endpoints, por lo tanto:

- debe iterarse día por día
- realizar consultas paginadas si aplica
- controlar rate limits
- registrar errores
- permitir reanudación del proceso

Este proceso histórico se ejecutará UNA SOLA VEZ.

Posteriormente un cronjob diario realizará sincronizaciones incrementales.

---

# Endpoints Requeridos

---

# 1. Obtener Licitaciones

## Obtener licitaciones del organismo

```txt
GET /licitaciones.json?ticket=API_KEY&CodigoOrganismo=7374
```

## Ejemplo

```txt
https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?ticket=API_KEY&CodigoOrganismo=7374
```

---

# 2. Obtener una Licitación específica

## Endpoint

```txt
GET /licitaciones.json?ticket=API_KEY&codigo=2080-48-LP26
```

## Ejemplo

```txt
https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?ticket=API_KEY&codigo=2080-48-LP26
```

## Objetivo

Permite obtener:

- detalle completo
- estados
- adjudicación
- montos
- proveedores
- metadata adicional

---

# 3. Obtener Órdenes de Compra

## Endpoint

```txt
GET /ordenesdecompra.json?fecha=DDMMYYYY&CodigoOrganismo=7374&ticket=API_KEY
```

## Ejemplo

```txt
https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json?fecha=11052026&CodigoOrganismo=7374&ticket=API_KEY
```

## Importante

Este endpoint devuelve TODAS las órdenes de compra del día indicado.

Debe ejecutarse iterando por fechas desde:

```txt
01-01-2025 → fecha actual
```

---

# Estados de Órdenes de Compra

La API retorna distintos estados:

| Estado                        | Código |
| ----------------------------- | ------ |
| Enviada a Proveedor           | 4      |
| En proceso                    | 5      |
| Aceptada                      | 6      |
| Cancelada                     | 9      |
| Recepción Conforme            | 12     |
| Pendiente de Recepcionar      | 13     |
| Recepcionada Parcialmente     | 14     |
| Recepción Conforme Incompleta | 15     |

Todos los estados deben almacenarse en la base de datos.

---

# 4. Obtener una Orden de Compra específica

## Endpoint

```txt
GET /ordenesdecompra.json?codigo=2080-3087-SE26&ticket=API_KEY
```

## Ejemplo

```txt
https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json?codigo=2080-3087-SE26&ticket=API_KEY
```

---

# Relación entre OC y Licitación

La respuesta de la orden de compra contiene:

```txt
CodigoLicitacion
```

Este campo debe utilizarse para relacionar:

```txt
OrdenCompra -> Licitacion
```

---

# Requerimiento Importante

Cada orden de compra contiene además:

- detalle
- proveedor
- montos
- fechas
- ítems

Todos estos datos deben persistirse en la base de datos.

---

# Recomendación de Arquitectura

Se recomienda separar las tablas:

## Tabla: licitaciones

Almacena:

- código licitación
- nombre
- estado
- fechas
- organismo
- adjudicación
- metadata

---

## Tabla: ordenes_compra

Almacena:

- código OC
- código licitación
- proveedor
- estado
- montos
- fechas
- metadata

---

## Tabla: ordenes_compra_items

Almacena:

- código OC
- producto
- cantidad
- precio
- total
- unidad
- descripción

---

# Flujo Recomendado

## Sincronización Histórica Inicial

```txt
1. Iterar fechas desde 01-01-2025
2. Obtener licitaciones
3. Guardar licitaciones
4. Obtener órdenes de compra del día
5. Guardar OC
6. Obtener detalle OC
7. Guardar ítems
8. Relacionar OC ↔ Licitación
```

---

# Cronjob Diario

Posteriormente el cronjob deberá:

```txt
1. Consultar licitaciones del día
2. Consultar órdenes de compra del día
3. Actualizar estados existentes
4. Insertar nuevos registros
5. Sincronizar ítems nuevos/modificados
```

---

# Consideraciones Técnicas

El agente debe considerar:

- reintentos automáticos
- manejo de timeouts
- logs detallados
- control de duplicados
- upserts
- paginación
- validación de respuestas vacías
- rate limiting
- tolerancia a fallos

---

# Resultado Esperado

La base de datos debe quedar completamente sincronizada con:

- Licitaciones
- Órdenes de Compra
- Ítems de Órdenes de Compra
- Relaciones entre entidades

permitiendo:

- dashboards
- reportería
- trazabilidad
- análisis financiero
- apoyo en futuras licitaciones
- visualización histórica completa del organismo
