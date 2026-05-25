INSERT IGNORE INTO `permisos` (`codigo`, `nombre`, `descripcion`, `categoria`)
VALUES
  ('sidebar.inicio', 'Ver menú Inicio', 'Permite visualizar el menú Inicio en el sidebar', 'Sidebar'),
  ('sidebar.novedades', 'Ver menú Novedades', 'Permite visualizar el menú Novedades en el sidebar', 'Sidebar'),
  ('sidebar.licitaciones', 'Ver menú Licitaciones', 'Permite visualizar el grupo Licitaciones en el sidebar', 'Sidebar'),
  ('sidebar.licitaciones.crear', 'Ver menú Crear Nuevo Proceso', 'Permite visualizar Crear Nuevo Proceso dentro de Licitaciones', 'Sidebar'),
  ('sidebar.licitaciones.mis_licitaciones', 'Ver menú Mis Licitaciones', 'Permite visualizar Mis Licitaciones dentro de Licitaciones', 'Sidebar'),
  ('sidebar.licitaciones.todas', 'Ver menú Todas las Licitaciones', 'Permite visualizar Todas las Licitaciones dentro de Licitaciones', 'Sidebar'),
  ('sidebar.bandeja', 'Ver menú Bandeja de Entrada', 'Permite visualizar Bandeja de Entrada en el sidebar', 'Sidebar'),
  ('sidebar.seguimiento_consumo', 'Ver menú Seguimiento Consumo', 'Permite visualizar Seguimiento Consumo en el sidebar', 'Sidebar'),
  ('sidebar.formato_bases', 'Ver menú Formato Bases', 'Permite visualizar Formato Bases en el sidebar', 'Sidebar'),
  ('sidebar.usuarios', 'Ver menú Usuarios', 'Permite visualizar Usuarios en el sidebar', 'Sidebar'),
  ('sidebar.gestion_novedades', 'Ver menú Gestión Novedades', 'Permite visualizar Gestión Novedades en el sidebar', 'Sidebar'),
  ('sidebar.gestion_permisos', 'Ver menú Gestión de Permisos', 'Permite visualizar Gestión de Permisos en el sidebar', 'Sidebar');

INSERT IGNORE INTO `roles_permisos` (`role_id`, `permiso_id`)
SELECT r.`id`, p.`id`
FROM `roles` r
CROSS JOIN `permisos` p
WHERE r.`name` = 'superadmin'
  AND p.`codigo` LIKE 'sidebar.%';
