ALTER TABLE `proceso_licitacion`
  MODIFY COLUMN `role_id` VARCHAR(36) NULL;

INSERT INTO `formato_liquidacion` (`titulo`, `cantidad_pasos`, `created_at`, `updated_at`)
SELECT 'Trato Directo', 8, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1
  FROM `formato_liquidacion`
  WHERE LOWER(`titulo`) = 'trato directo'
);

SET @formato_trato_directo_id = (
  SELECT `id`
  FROM `formato_liquidacion`
  WHERE LOWER(`titulo`) = 'trato directo'
  LIMIT 1
);

UPDATE `formato_liquidacion`
SET `cantidad_pasos` = 8,
    `updated_at` = NOW()
WHERE `id` = @formato_trato_directo_id;

INSERT INTO `proceso_licitacion` (
  `fk_formato_liquidacion_id`,
  `titulo_proceso`,
  `numero_paso`,
  `dias_sugeridos`,
  `created_at`,
  `updated_at`,
  `role_id`
)
SELECT @formato_trato_directo_id, 'Confección Bases Técnicas', 1, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 1
);

INSERT INTO `proceso_licitacion` (
  `fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`
)
SELECT @formato_trato_directo_id, 'Firmas Jefatura de Unidad y Jefatura de Dpto.', 2, 3, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 2
);

INSERT INTO `proceso_licitacion` (
  `fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`
)
SELECT @formato_trato_directo_id, 'Unidad Administrativa Legal', 3, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 3
);

INSERT INTO `proceso_licitacion` (
  `fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`
)
SELECT @formato_trato_directo_id, 'Firmas Subdirector Administrativo y Director', 4, 3, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 4
);

INSERT INTO `proceso_licitacion` (
  `fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`
)
SELECT @formato_trato_directo_id, 'Fecha y Enumeración de Oficina de Partes', 5, 2, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 5
);

INSERT INTO `proceso_licitacion` (
  `fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`
)
SELECT @formato_trato_directo_id, 'Presupuesto', 6, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 6
);

INSERT INTO `proceso_licitacion` (
  `fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`
)
SELECT @formato_trato_directo_id, 'Firmas Jefatura de Unidad y Jefatura de Dpto.', 7, 3, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 7
);

INSERT INTO `proceso_licitacion` (
  `fk_formato_liquidacion_id`, `titulo_proceso`, `numero_paso`, `dias_sugeridos`, `created_at`, `updated_at`, `role_id`
)
SELECT @formato_trato_directo_id, 'Confección de Contrato', 8, 5, NOW(), NOW(), NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `proceso_licitacion`
  WHERE `fk_formato_liquidacion_id` = @formato_trato_directo_id AND `numero_paso` = 8
);
