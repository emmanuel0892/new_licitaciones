ALTER TABLE `roles_permisos`
  MODIFY COLUMN `role_id` VARCHAR(36) NOT NULL;

SET @has_roles_permisos_role_fk = (
  SELECT COUNT(*)
  FROM `information_schema`.`KEY_COLUMN_USAGE`
  WHERE `TABLE_SCHEMA` = DATABASE()
    AND `TABLE_NAME` = 'roles_permisos'
    AND `COLUMN_NAME` = 'role_id'
    AND `REFERENCED_TABLE_NAME` = 'roles'
    AND `REFERENCED_COLUMN_NAME` = 'id'
);

SET @add_roles_permisos_role_fk = IF(
  @has_roles_permisos_role_fk = 0,
  'ALTER TABLE `roles_permisos` ADD CONSTRAINT `fk_roles_permisos_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);

PREPARE statement FROM @add_roles_permisos_role_fk;
EXECUTE statement;
DEALLOCATE PREPARE statement;
