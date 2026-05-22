-- Agregar campo inicioAnticipado a la tabla licitaciones
ALTER TABLE licitaciones ADD COLUMN inicio_anticipado BOOLEAN DEFAULT FALSE AFTER fecha_recepcion;
