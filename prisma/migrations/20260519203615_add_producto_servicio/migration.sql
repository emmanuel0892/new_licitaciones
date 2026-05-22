/*
  Warnings:

  - Added the required column `producto_servicio` to the `licitaciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `licitaciones` ADD COLUMN `producto_servicio` VARCHAR(191) NOT NULL;
