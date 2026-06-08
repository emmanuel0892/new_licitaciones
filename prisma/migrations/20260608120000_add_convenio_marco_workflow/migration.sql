INSERT INTO `formato_liquidacion` (`titulo`, `cantidad_pasos`, `created_at`, `updated_at`)
SELECT 'Convenio Marco / Gran Compra', 16, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM `formato_liquidacion`
  WHERE LOWER(`titulo`) LIKE '%convenio%'
     OR LOWER(`titulo`) LIKE '%gran compra%'
);

SET @formato_convenio_marco_id = (
  SELECT `id`
  FROM `formato_liquidacion`
  WHERE LOWER(`titulo`) LIKE '%convenio%'
     OR LOWER(`titulo`) LIKE '%gran compra%'
  ORDER BY `id`
  LIMIT 1
);

UPDATE `formato_liquidacion`
SET `cantidad_pasos` = 16,
    `updated_at` = NOW()
WHERE `id` = @formato_convenio_marco_id;

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Confeccion de Intencion de Compra', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 1;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Confeccion de Intencion de Compra', 1, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 1
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Firma Jefatura de Unidad y Dpto.', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 2;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Firma Jefatura de Unidad y Dpto.', 2, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 2
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Unidad Administrativa Legal', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 3;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Unidad Administrativa Legal', 3, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 3
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Firma Jefatura Unidad Administrativo Legal', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 4;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Firma Jefatura Unidad Administrativo Legal', 4, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 4
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Firma Subdirector Administrativo y Direccion', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 5;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Firma Subdirector Administrativo y Direccion', 5, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 5
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Fecha y Enumeracion de Oficina de Partes', `dias_sugeridos` = 2, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 6;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Fecha y Enumeracion de Oficina de Partes', 6, 2, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 6
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Publicacion en Mercado Publico', `dias_sugeridos` = 1, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 7;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Publicacion en Mercado Publico', 7, 1, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 7
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Periodo de Apertura y Evaluacion Tecnica de Ofertas', `dias_sugeridos` = 10, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 8;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Periodo de Apertura y Evaluacion Tecnica de Ofertas', 8, 10, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 8
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Confeccion de Res. Preseleccion de Oferta y Comision', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 9;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Confeccion de Res. Preseleccion de Oferta y Comision', 9, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 9
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Presupuesto', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 10;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Presupuesto', 10, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 10
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Firmas Jefatura de Unidad y Jefatura de Dpto.', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 11;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Firmas Jefatura de Unidad y Jefatura de Dpto.', 11, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 11
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Unidad Administrativa Legal', `dias_sugeridos` = 5, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 12;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Unidad Administrativa Legal', 12, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 12
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Firma Jefatura Unidad Administrativo Legal', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 13;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Firma Jefatura Unidad Administrativo Legal', 13, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 13
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Firma Subdirector Administrativo', `dias_sugeridos` = 0, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 14;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Firma Subdirector Administrativo', 14, 0, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 14
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Fecha y Enumeracion de Oficina de Partes', `dias_sugeridos` = 2, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 15;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Fecha y Enumeracion de Oficina de Partes', 15, 2, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 15
);

UPDATE `proceso_licitacion`
SET `titulo_proceso` = 'Publicacion de Seleccion de Oferta o Desercion', `dias_sugeridos` = 1, `updated_at` = NOW()
WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 16;

INSERT INTO `proceso_licitacion` (`fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`)
SELECT @formato_convenio_marco_id, 'Publicacion de Seleccion de Oferta o Desercion', 16, 1, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_convenio_marco_id AND `numero_paso` = 16
);

INSERT IGNORE INTO `permisos` (`codigo`, `nombre`, `descripcion`, `categoria`)
VALUES
  ('convenio_marco.ver_flujo', 'Ver flujo Convenio Marco / Gran Compra', 'Permite visualizar el flujo de trabajo de Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('convenio_marco.ver_historial', 'Ver historial Convenio Marco / Gran Compra', 'Permite visualizar el historial de Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('convenio_marco.subir_documento', 'Subir documentos Convenio Marco / Gran Compra', 'Permite subir documentos en procesos de Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('convenio_marco.ver_documentos', 'Ver documentos Convenio Marco / Gran Compra', 'Permite ver documentos asociados a Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('convenio_marco.editar_codigo_mercado_publico', 'Editar codigo Mercado Publico en Convenio Marco / Gran Compra', 'Permite editar el codigo Mercado Publico en el paso correspondiente de Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.1', 'Avanzar paso 1 - Confeccion de Intencion de Compra', 'Permite avanzar el paso interno 1 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.2', 'Avanzar paso 1.1 - Firma Jefatura de Unidad y Dpto.', 'Permite avanzar el paso interno 2 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.3', 'Avanzar paso 2 - Unidad Administrativa Legal', 'Permite avanzar el paso interno 3 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.4', 'Avanzar paso 2.1 - Firma Jefatura Unidad Administrativo Legal', 'Permite avanzar el paso interno 4 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.5', 'Avanzar paso 3 - Firma Subdirector Administrativo y Direccion', 'Permite avanzar el paso interno 5 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.6', 'Avanzar paso 3.1 - Fecha y Enumeracion de Oficina de Partes', 'Permite avanzar el paso interno 6 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.7', 'Avanzar paso 4 - Publicacion en Mercado Publico', 'Permite avanzar el paso interno 7 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.8', 'Avanzar paso 5 - Periodo de Apertura y Evaluacion Tecnica de Ofertas', 'Permite avanzar el paso interno 8 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.9', 'Avanzar paso 6 - Confeccion de Res. Preseleccion de Oferta y Comision', 'Permite avanzar el paso interno 9 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.10', 'Avanzar paso 7 - Presupuesto', 'Permite avanzar el paso interno 10 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.11', 'Avanzar paso 7.1 - Firmas Jefatura de Unidad y Jefatura de Dpto.', 'Permite avanzar el paso interno 11 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.12', 'Avanzar paso 8 - Unidad Administrativa Legal', 'Permite avanzar el paso interno 12 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.13', 'Avanzar paso 8.1 - Firma Jefatura Unidad Administrativo Legal', 'Permite avanzar el paso interno 13 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.14', 'Avanzar paso 9 - Firma Subdirector Administrativo', 'Permite avanzar el paso interno 14 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.15', 'Avanzar paso 9.1 - Fecha y Enumeracion de Oficina de Partes', 'Permite avanzar el paso interno 15 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.avanzar.16', 'Avanzar paso 10 - Publicacion de Seleccion de Oferta o Desercion', 'Permite avanzar el paso interno 16 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.1', 'Devolver paso 1 - Confeccion de Intencion de Compra', 'Permite devolver desde el paso interno 1 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.2', 'Devolver paso 1.1 - Firma Jefatura de Unidad y Dpto.', 'Permite devolver desde el paso interno 2 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.3', 'Devolver paso 2 - Unidad Administrativa Legal', 'Permite devolver desde el paso interno 3 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.4', 'Devolver paso 2.1 - Firma Jefatura Unidad Administrativo Legal', 'Permite devolver desde el paso interno 4 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.5', 'Devolver paso 3 - Firma Subdirector Administrativo y Direccion', 'Permite devolver desde el paso interno 5 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.6', 'Devolver paso 3.1 - Fecha y Enumeracion de Oficina de Partes', 'Permite devolver desde el paso interno 6 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.7', 'Devolver paso 4 - Publicacion en Mercado Publico', 'Permite devolver desde el paso interno 7 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.8', 'Devolver paso 5 - Periodo de Apertura y Evaluacion Tecnica de Ofertas', 'Permite devolver desde el paso interno 8 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.9', 'Devolver paso 6 - Confeccion de Res. Preseleccion de Oferta y Comision', 'Permite devolver desde el paso interno 9 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.10', 'Devolver paso 7 - Presupuesto', 'Permite devolver desde el paso interno 10 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.11', 'Devolver paso 7.1 - Firmas Jefatura de Unidad y Jefatura de Dpto.', 'Permite devolver desde el paso interno 11 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.12', 'Devolver paso 8 - Unidad Administrativa Legal', 'Permite devolver desde el paso interno 12 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.13', 'Devolver paso 8.1 - Firma Jefatura Unidad Administrativo Legal', 'Permite devolver desde el paso interno 13 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.14', 'Devolver paso 9 - Firma Subdirector Administrativo', 'Permite devolver desde el paso interno 14 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.15', 'Devolver paso 9.1 - Fecha y Enumeracion de Oficina de Partes', 'Permite devolver desde el paso interno 15 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra'),
  ('workflow.convenio_marco.devolver.16', 'Devolver paso 10 - Publicacion de Seleccion de Oferta o Desercion', 'Permite devolver desde el paso interno 16 del flujo Convenio Marco / Gran Compra', 'Convenio Marco / Gran Compra');
