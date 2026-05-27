ALTER TABLE `documentos_licitacion`
  MODIFY COLUMN `nombre_archivo` VARCHAR(255) NOT NULL,
  MODIFY COLUMN `ruta_archivo` VARCHAR(500) NOT NULL,
  ADD COLUMN `nombre_original` VARCHAR(255) NULL,
  ADD COLUMN `mime_type` VARCHAR(150) NULL,
  ADD COLUMN `size_bytes` BIGINT NULL,
  ADD COLUMN `numero_licitacion` VARCHAR(100) NULL,
  ADD COLUMN `numero_paso` INTEGER NULL,
  ADD COLUMN `proceso_nombre` VARCHAR(255) NULL,
  ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

UPDATE `documentos_licitacion` AS `documento`
INNER JOIN `licitaciones` AS `licitacion`
  ON `licitacion`.`id` = `documento`.`fk_licitacion_id`
SET `documento`.`numero_licitacion` = COALESCE(
  NULLIF(`licitacion`.`codigo_mercado_publico`, ''),
  NULLIF(`licitacion`.`numero_licitacion`, ''),
  CAST(`licitacion`.`id` AS CHAR)
)
WHERE `documento`.`numero_licitacion` IS NULL;

ALTER TABLE `documentos_licitacion`
  MODIFY COLUMN `numero_licitacion` VARCHAR(100) NOT NULL,
  ADD INDEX `documentos_licitacion_numero_licitacion_idx` (`numero_licitacion`),
  ADD INDEX `documentos_licitacion_numero_paso_idx` (`numero_paso`);
