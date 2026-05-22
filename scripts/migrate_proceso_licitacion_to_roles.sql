-- MIGRACIÓN COMPLETA PARA USAR UUIDS EN ROLES Y MIGRAR PROCESO_LICITACION
-- Este script debe ejecutarse completo en phpMyAdmin

-- ============================================
-- PARTE 1: Actualizar tabla roles para usar UUID
-- ============================================

-- Paso 1: Agregar columna temporal new_id para UUIDs
ALTER TABLE roles ADD COLUMN new_id VARCHAR(36) NULL;

-- Paso 2: Generar UUIDs para roles existentes
-- MySQL no tiene UUID() nativo, usamos una función simple
UPDATE roles SET new_id = 
  CONCAT(
    SUBSTRING(MD5(RAND()), 1, 8), '-',
    SUBSTRING(MD5(RAND()), 9, 4), '-',
    SUBSTRING(MD5(RAND()), 13, 4), '-',
    SUBSTRING(MD5(RAND()), 17, 4), '-',
    SUBSTRING(MD5(RAND()), 21, 12)
  );

-- Paso 3: Actualizar user_roles para usar los nuevos UUIDs
UPDATE user_roles ur
SET ur.role_id = (
  SELECT r.new_id FROM roles r WHERE r.id = ur.role_id
);

-- Paso 4: Actualizar proceso_licitacion para usar los nuevos UUIDs
-- Primero agregar columna role_id si no existe
SET @column_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'new_licitaciones' 
  AND TABLE_NAME = 'proceso_licitacion' 
  AND COLUMN_NAME = 'role_id'
);

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE proceso_licitacion ADD COLUMN role_id VARCHAR(36) NULL', 
  'SELECT "Columna role_id ya existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Paso 5: Migrar datos de turno a role_id usando los nuevos UUIDs
UPDATE proceso_licitacion pl
SET role_id = (
  SELECT r.new_id FROM roles r WHERE r.name = 
  CASE pl.turno
    WHEN 'Licitador' THEN 'licitador'
    WHEN 'Secretario Juridico' THEN 'secretario_juridico'
    WHEN 'Secretario Jurídico' THEN 'secretario_juridico'
    WHEN 'Presupuesto' THEN 'presupuesto'
    WHEN 'Subdireccion Administrativa' THEN 'subdireccion_administrativa'
    WHEN 'Subdirección Administrativa' THEN 'subdireccion_administrativa'
    ELSE pl.turno
  END
  LIMIT 1
)
WHERE pl.turno IS NOT NULL;

-- Paso 6: Eliminar foreign keys existentes
ALTER TABLE user_roles DROP FOREIGN KEY fk_user_roles_role;
ALTER TABLE proceso_licitacion DROP FOREIGN KEY IF EXISTS fk_proceso_licitacion_role_id;

-- Paso 7: Cambiar la columna id a VARCHAR(36) en roles
ALTER TABLE roles MODIFY COLUMN id VARCHAR(36) NOT NULL;

-- Paso 8: Copiar los nuevos UUIDs a la columna id
UPDATE roles SET id = new_id;

-- Paso 9: Eliminar la columna temporal new_id
ALTER TABLE roles DROP COLUMN new_id;

-- Paso 10: Re-crear foreign keys con las nuevas definiciones
ALTER TABLE user_roles 
ADD CONSTRAINT fk_user_roles_role 
FOREIGN KEY (role_id) REFERENCES roles(id) 
ON DELETE CASCADE ON UPDATE RESTRICT;

-- ============================================
-- PARTE 2: Finalizar migración de proceso_licitacion
-- ============================================

-- Paso 11: Validar que todos los role_id existan en roles
SELECT COUNT(*) as registros_sin_rol_valido 
FROM proceso_licitacion 
WHERE role_id IS NOT NULL 
AND role_id NOT IN (SELECT id FROM roles);

-- Paso 12: Establecer role_id como NOT NULL después de validar
-- Descomentar después de verificar que el paso 11 devuelve 0
-- ALTER TABLE proceso_licitacion MODIFY COLUMN role_id VARCHAR(36) NOT NULL;

-- Paso 13: Agregar foreign key en proceso_licitacion
ALTER TABLE proceso_licitacion 
ADD CONSTRAINT fk_proceso_licitacion_role_id 
FOREIGN KEY (role_id) REFERENCES roles(id) 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Paso 14: Eliminar columna turno (opcional, después de verificar que todo funciona)
-- Descomentar después de actualizar todo el código
-- ALTER TABLE proceso_licitacion DROP COLUMN turno;

-- Paso 15: Crear índice en role_id (si no existe)
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = 'new_licitaciones' 
  AND TABLE_NAME = 'proceso_licitacion' 
  AND INDEX_NAME = 'idx_proceso_licitacion_role_id'
);

SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_proceso_licitacion_role_id ON proceso_licitacion(role_id)', 
  'SELECT "Índice idx_proceso_licitacion_role_id ya existe"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
