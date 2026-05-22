-- Agregar campo flujo_post_paso_11 a la tabla licitaciones
-- Este script debe ejecutarse en phpMyAdmin

ALTER TABLE licitaciones ADD COLUMN flujo_post_paso_11 VARCHAR(30) NULL DEFAULT NULL AFTER inicio_anticipado;
