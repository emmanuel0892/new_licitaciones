SET @documentos_tipo_documento_column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'documentos_licitacion'
    AND COLUMN_NAME = 'tipo_documento'
);

SET @documentos_tipo_documento_column_sql = IF(
  @documentos_tipo_documento_column_exists = 0,
  'ALTER TABLE `documentos_licitacion` ADD COLUMN `tipo_documento` VARCHAR(100) NULL',
  'SELECT 1'
);

PREPARE documentos_tipo_documento_column_stmt FROM @documentos_tipo_documento_column_sql;
EXECUTE documentos_tipo_documento_column_stmt;
DEALLOCATE PREPARE documentos_tipo_documento_column_stmt;

SET @documentos_tipo_documento_index_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'documentos_licitacion'
    AND INDEX_NAME = 'documentos_licitacion_tipo_documento_idx'
);

SET @documentos_tipo_documento_index_sql = IF(
  @documentos_tipo_documento_index_exists = 0,
  'CREATE INDEX `documentos_licitacion_tipo_documento_idx` ON `documentos_licitacion` (`tipo_documento`)',
  'SELECT 1'
);

PREPARE documentos_tipo_documento_index_stmt FROM @documentos_tipo_documento_index_sql;
EXECUTE documentos_tipo_documento_index_stmt;
DEALLOCATE PREPARE documentos_tipo_documento_index_stmt;

INSERT INTO `formato_liquidacion` (`titulo`, `cantidad_pasos`, `created_at`, `updated_at`)
SELECT 'Trato Directo', 11, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM `formato_liquidacion`
  WHERE LOWER(`titulo`) = 'trato directo'
);

SET @formato_trato_directo_id = (
  SELECT `id`
  FROM `formato_liquidacion`
  WHERE LOWER(`titulo`) = 'trato directo'
  ORDER BY `id`
  LIMIT 1
);

UPDATE `formato_liquidacion`
SET `cantidad_pasos` = 11,
    `updated_at` = NOW()
WHERE `id` = @formato_trato_directo_id;

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'MEMO TRATO DIRECTO', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 1;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'MEMO TRATO DIRECTO', 1, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 1
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Carga de certificados', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 2;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Carga de certificados', 2, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 2
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Firmas Jefatura de Unidad y Jefatura de Dpto.', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 3;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Firmas Jefatura de Unidad y Jefatura de Dpto.', 3, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 3
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Unidad Administrativa Legal', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 4;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Unidad Administrativa Legal', 4, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 4
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Ingreso codigo OC', `dias_sugeridos` = 1, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 5;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Ingreso codigo OC', 5, 1, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 5
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Unidad ADM. Legal Confeccion de contrato', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 6;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Unidad ADM. Legal Confeccion de contrato', 6, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 6
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Contrato al Proveedor', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 7;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Contrato al Proveedor', 7, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 7
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Firmas Jefatura de Unidad y Jefatura de Dpto.', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 8;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Firmas Jefatura de Unidad y Jefatura de Dpto.', 8, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 8
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Unidad Administrativa Legal', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 9;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Unidad Administrativa Legal', 9, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 9
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Firmas Subdirector Administrativo y Director', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 10;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Firmas Subdirector Administrativo y Director', 10, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 10
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Envio de OC', `dias_sugeridos` = 1, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 11;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_trato_directo_id, 'Envio de OC', 11, 1, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 11
);

INSERT INTO `permisos` (`codigo`, `nombre`, `descripcion`, `categoria`)
VALUES
  ('trato_directo.ver_flujo', 'Ver flujo Trato Directo', 'Permite visualizar el flujo de trabajo de Trato Directo', 'Trato Directo'),
  ('trato_directo.ver_historial', 'Ver historial Trato Directo', 'Permite visualizar el historial de Trato Directo', 'Trato Directo'),
  ('trato_directo.subir_documento', 'Subir documentos Trato Directo', 'Permite subir documentos en procesos de Trato Directo', 'Trato Directo'),
  ('trato_directo.ver_documentos', 'Ver documentos Trato Directo', 'Permite ver documentos asociados a Trato Directo', 'Trato Directo'),
  ('trato_directo.editar_codigo_mercado_publico', 'Editar codigo Mercado Publico en Trato Directo', 'Permite editar el codigo Mercado Publico en el paso correspondiente de Trato Directo', 'Trato Directo'),
  ('trato_directo.subir_certificados', 'Subir certificados Trato Directo', 'Permite cargar certificados obligatorios en el paso 1.1 de Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.1', 'Avanzar paso 1 - MEMO TRATO DIRECTO', 'Permite avanzar el paso interno 1 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.2', 'Avanzar paso 1.1 - Carga de certificados', 'Permite avanzar el paso interno 2 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.3', 'Avanzar paso 1.2 - Firmas Jefatura de Unidad y Jefatura de Dpto.', 'Permite avanzar el paso interno 3 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.4', 'Avanzar paso 2 - Unidad Administrativa Legal', 'Permite avanzar el paso interno 4 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.5', 'Avanzar paso 3 - Ingreso codigo OC', 'Permite avanzar el paso interno 5 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.6', 'Avanzar paso 4 - Unidad ADM. Legal Confeccion de contrato', 'Permite avanzar el paso interno 6 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.7', 'Avanzar paso 5 - Contrato al Proveedor', 'Permite avanzar el paso interno 7 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.8', 'Avanzar paso 5.1 - Firmas Jefatura de Unidad y Jefatura de Dpto.', 'Permite avanzar el paso interno 8 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.9', 'Avanzar paso 6 - Unidad Administrativa Legal', 'Permite avanzar el paso interno 9 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.10', 'Avanzar paso 6.1 - Firmas Subdirector Administrativo y Director', 'Permite avanzar el paso interno 10 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.avanzar.11', 'Avanzar paso 7 - Envio de OC', 'Permite avanzar el paso interno 11 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.1', 'Devolver paso 1 - MEMO TRATO DIRECTO', 'Permite devolver desde el paso interno 1 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.2', 'Devolver paso 1.1 - Carga de certificados', 'Permite devolver desde el paso interno 2 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.3', 'Devolver paso 1.2 - Firmas Jefatura de Unidad y Jefatura de Dpto.', 'Permite devolver desde el paso interno 3 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.4', 'Devolver paso 2 - Unidad Administrativa Legal', 'Permite devolver desde el paso interno 4 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.5', 'Devolver paso 3 - Ingreso codigo OC', 'Permite devolver desde el paso interno 5 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.6', 'Devolver paso 4 - Unidad ADM. Legal Confeccion de contrato', 'Permite devolver desde el paso interno 6 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.7', 'Devolver paso 5 - Contrato al Proveedor', 'Permite devolver desde el paso interno 7 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.8', 'Devolver paso 5.1 - Firmas Jefatura de Unidad y Jefatura de Dpto.', 'Permite devolver desde el paso interno 8 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.9', 'Devolver paso 6 - Unidad Administrativa Legal', 'Permite devolver desde el paso interno 9 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.10', 'Devolver paso 6.1 - Firmas Subdirector Administrativo y Director', 'Permite devolver desde el paso interno 10 del flujo Trato Directo', 'Trato Directo'),
  ('workflow.trato_directo.devolver.11', 'Devolver paso 7 - Envio de OC', 'Permite devolver desde el paso interno 11 del flujo Trato Directo', 'Trato Directo')
ON DUPLICATE KEY UPDATE
  `nombre` = VALUES(`nombre`),
  `descripcion` = VALUES(`descripcion`),
  `categoria` = VALUES(`categoria`),
  `updated_at` = NOW();
