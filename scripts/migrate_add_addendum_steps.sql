-- Migración para agregar soporte de Addendum al workflow de licitaciones.
-- Ejecutar en la base de datos antes de correr:
-- npx prisma db pull
-- npx prisma generate

SET @formato_id = (
  SELECT id
  FROM formato_liquidacion
  WHERE titulo LIKE '%Licitación%' OR titulo LIKE '%Licitacion%' OR titulo LIKE '%Adquisición%'
  LIMIT 1
);

SET @add_column_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'licitaciones'
        AND COLUMN_NAME = 'requiere_addendum'
    ),
    'SELECT "La columna requiere_addendum ya existe"',
    'ALTER TABLE licitaciones ADD COLUMN requiere_addendum BOOLEAN NOT NULL DEFAULT false'
  )
);

PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Confección de Addendum', 36, 5, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 25 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'licitador' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 36);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Revisión de Unidad Administrativa Legal', 37, 5, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 26 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'secretario_juridico' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 37);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Envío a Proveedor', 38, 3, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 27 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'licitador' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 38);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Confección de res. que aprueba el contrato', 39, 5, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 28 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'licitador' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 39);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Firmas Jefatura de Unidad y Jefatura de Dpto.', 40, 0, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 29 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'jefe_adquisiciones' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 40);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Unidad Administrativa Legal', 41, 5, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 30 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'secretario_juridico' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 41);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Firma Jefatura Unidad Administrativo Legal', 42, 0, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 31 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'jefe_unidad_legal' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 42);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Firmas directivos y partes', 43, 5, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 32 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'subdirector_administrativo' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 43);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Firmas Subdirector Administrador y Director (a)', 44, 0, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 33 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'subdirector_administrativo' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 44);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Fecha y Enumeración de Oficina de Partes', 45, 1, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 34 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'oficina_partes' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 45);

INSERT INTO proceso_licitacion (fk_formato_liquidacion_id, titulo_proceso, numero_paso, dias_sugeridos, role_id)
SELECT @formato_id, 'Publicación en el portal', 46, 5, COALESCE(
  (SELECT role_id FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 35 LIMIT 1),
  (SELECT id FROM roles WHERE name = 'licitador' LIMIT 1),
  (SELECT id FROM roles LIMIT 1)
)
WHERE @formato_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM proceso_licitacion WHERE fk_formato_liquidacion_id = @formato_id AND numero_paso = 46);

UPDATE formato_liquidacion
SET cantidad_pasos = GREATEST(cantidad_pasos, 46)
WHERE id = @formato_id;

SELECT *
FROM proceso_licitacion
WHERE fk_formato_liquidacion_id = @formato_id
  AND numero_paso BETWEEN 36 AND 46
ORDER BY numero_paso ASC;
