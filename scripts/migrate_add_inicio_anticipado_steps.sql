-- Migración para agregar pasos de inicio anticipado (16-23) a proceso_licitacion
-- Este script debe ejecutarse en phpMyAdmin

-- Primero, obtener el formatoLiquidacionId para "Licitación"
-- Ajusta el valor según corresponda a tu base de datos
SET @formato_id = (SELECT id FROM formato_liquidacion WHERE titulo LIKE '%Licitación%' LIMIT 1);

-- Insertar pasos de inicio anticipado (16-23)
INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id) VALUES
(@formato_id, 'Confección Res. de inicio anticipado', 16, 5, NULL),
(@formato_id, 'Firmas Jefatura de Unidad y Jefatura de Dpto.', 17, 0, NULL),
(@formato_id, 'Unidad Administrativa Legal', 18, 5, NULL),
(@formato_id, 'Firma Jefatura Unidad Administrativo Legal', 19, 0, NULL),
(@formato_id, 'Firmas Directivos y partes', 20, 5, NULL),
(@formato_id, 'Firmas Subdirector Administrativo y Director (a)', 21, 0, NULL),
(@formato_id, 'Fecha y Enumeración de Oficina de Partes', 22, 1, NULL),
(@formato_id, 'Publicación de Inicio Anticipado', 23, 5, NULL);

-- Actualizar cantidad_pasos en formato_liquidacion
UPDATE formato_liquidacion 
SET cantidad_pasos = 23 
WHERE id = @formato_id;

-- Verificar que los pasos se agregaron correctamente
SELECT * FROM proceso_licitacion 
WHERE fk_formato_liquidacion_id = @formato_id 
AND numero_paso >= 16 
ORDER BY numero_paso ASC;
