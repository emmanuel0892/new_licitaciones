### Creación de modulo de órdenes de compra

1. **link de api**:
   - https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json?fecha=08052026&estado=aceptada&CodigoOrganismo=7374&ticket=8E6AFEDD-E204-4921-90C3-CD736B80D116

2. **fecha** :
   - Debe ser dinamica, se debe seleccionar el rango de fechas que se desea consultar

3. **estado** :
   - Debe ser dinamico, se debe seleccionar el estado que se desea consultar

4. **CodigoOrganismo** :
   - Debe ser dinamico, se debe seleccionar el codigo de organismo que se desea consultar

5. **ticket** :
   - Debe ser dinamico, se debe seleccionar el ticket que se desea consultar

6. **Tabla** :
   - Debe mostrar los datos de las ordenes de compra
   - Debe tener filtros para buscar por nombre, rut, etc
   - Debe tener paginación
   - Debe tener ordenamiento por columnas
   - Debe tener acciones para cada fila

7. **Columnas de la tabla** :

| Columna          | Campo Origen                       | Descripción                                                     |
| ---------------- | ---------------------------------- | --------------------------------------------------------------- |
| Código OC        | Codigo                             | Identificador único de la Orden de Compra (ej: 2080-28783-SE25) |
| Licitación       | CodigoLicitacion                   | Código de origen de la licitación (ej: 2080-198-LQ24)           |
| Producto         | Nombre / Items.Listado[0].Producto | Nombre del producto principal                                   |
| Estado           | Estado                             | Estado actual (ej: "Recepción Conforme")                        |
| Estado Proveedor | EstadoProveedor                    | Estado desde vista del proveedor                                |
| Total            | Total                              | Monto total con IVA (ej: $5.331.200)                            |
| Comprador        | Comprador.NombreOrganismo          | Institución compradora                                          |
| Unidad           | Comprador.NombreUnidad             | Unidad específica solicitante                                   |
| Proveedor        | Proveedor.Nombre                   | Empresa adjudicataria                                           |
| Fecha Creación   | Fechas.FechaCreacion               | Cuándo se generó la OC                                          |
| Última Modif.    | Fechas.FechaUltimaModificacion     | Último cambio registrado                                        |
| Tipo             | Tipo                               | Tipo de orden (ej: SE = Solicitud Específica) scribd            |

8. **Acciones** :
   - icono para ver detalle de la orden de compra
   - icono para descargar la orden de compra en formato PDF

9. **Precarga de datos** :
   - Los campos de fecha, estado, codigo de organismo y ticket deben estar pre cargados con los valores por defecto
   - Los valores por defecto son:
     - fecha: hoy
     - estado: aceptada
     - codigo de organismo: 7374 (no se puede modificar)
     - ticket: 8E6AFEDD-E204-4921-90C3-CD736B80D116 (no se puede modificar)
