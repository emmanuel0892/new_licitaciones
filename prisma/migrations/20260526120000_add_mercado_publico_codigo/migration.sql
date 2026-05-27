ALTER TABLE `licitaciones`
  ADD COLUMN `codigo_mercado_publico` VARCHAR(50) NULL;

INSERT IGNORE INTO `permisos` (`codigo`, `nombre`, `descripcion`, `categoria`)
VALUES
  ('mercado_publico.ver', 'Ver datos de Mercado Publico', 'Permite consultar en linea datos asociados a una licitacion', 'Mercado Publico'),
  ('mercado_publico.editar_codigo', 'Editar codigo Mercado Publico', 'Permite guardar el codigo Mercado Publico en el primer paso', 'Mercado Publico'),
  ('mercado_publico.sincronizar', 'Consultar Mercado Publico', 'Permite consultar datos externos sin persistirlos', 'Mercado Publico');
