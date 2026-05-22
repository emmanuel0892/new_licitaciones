-- Migración para agregar pasos de contrato (24-34) a proceso_licitacion
-- Este script debe ejecutarse en phpMyAdmin

-- Primero, obtener el formatoLiquidacionId para "Licitacion"
-- Ajusta el valor según corresponda a tu base de datos
SET @formato_id = (SELECT id FROM formato_liquidacion WHERE titulo LIKE '%Licitacion%' LIMIT 1);

-- Insertar pasos de contrato (24-34)
INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id) VALUES
(@formato_id, 'Confección de Contrato', 24, 5, NULL),
(@formato_id, 'Revisión Unidad Administrativa Legal', 25, 5, NULL),
(@formato_id, 'Envío a Proveedor', 26, 3, NULL),
(@formato_id, 'Confección de Res. que aprueba el contrato', 27, 5, NULL),
(@formato_id, 'Firmas Jefatura de Unidad y Jefatura de Dpto', 28, 0, NULL),
(@formato_id, 'Unidad Administrativa Legal', 29, 5, NULL),
(@formato_id, 'Firma Jefatura Unidad Administrativo Legal', 30, 0, NULL),
(@formato_id, 'Firmas directivos y Partes', 31, 5, NULL),
(@formato_id, 'Firmas Subdirector Administrativo y Director(a)', 32, 0, NULL),
(@formato_id, 'Fecha y Enumeración de Oficina de Partes', 33, 1, NULL),
(@formato_id, 'Publicación de ficha de Contrato', 34, 5, NULL);

-- Actualizar cantidad_pasos en formato_liquidacion
UPDATE formato_liquidacion 
SET cantidad_pasos = 34 
WHERE id = @formato_id;

-- Verificar que los pasos se agregaron correctamente
SELECT * FROM proceso_licitacion 
WHERE fk_formato_liquidacion_id = @formato_id 
AND numero_paso >= 24 
ORDER BY numero_paso ASC;
