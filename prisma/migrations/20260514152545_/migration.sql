-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `lastname` VARCHAR(191) NOT NULL,
    `rut` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `type_account` VARCHAR(191) NOT NULL,
    `departamento` VARCHAR(191) NOT NULL,
    `active` VARCHAR(191) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_rut_key`(`rut`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formato_liquidacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `cantidad_pasos` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proceso_licitacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_formato_liquidacion_id` INTEGER NOT NULL,
    `titulo_proceso` VARCHAR(191) NOT NULL,
    `turno` VARCHAR(191) NOT NULL,
    `numero_paso` INTEGER NOT NULL,
    `dias_sugeridos` INTEGER NOT NULL DEFAULT 5,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `licitaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_formato_liquidacion_id` INTEGER NOT NULL,
    `fk_usuario_id` VARCHAR(191) NOT NULL,
    `fk_proceso_actual_id` INTEGER NOT NULL,
    `requirente` VARCHAR(191) NOT NULL,
    `numero_licitacion` VARCHAR(191) NULL,
    `vigencia` DATETIME(3) NULL,
    `nombre_licitacion` VARCHAR(191) NOT NULL,
    `monto_presupuestado` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'Pendiente',
    `contador_devoluciones` INTEGER NOT NULL DEFAULT 0,
    `contador_ediciones` INTEGER NOT NULL DEFAULT 0,
    `fecha_recepcion` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentos_licitacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_licitacion_id` INTEGER NOT NULL,
    `fk_usuario_id` VARCHAR(191) NOT NULL,
    `nombre_archivo` VARCHAR(191) NOT NULL,
    `ruta_archivo` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_licitacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_licitacion_id` INTEGER NOT NULL,
    `fk_usuario_id` VARCHAR(191) NOT NULL,
    `tipo_accion` VARCHAR(191) NOT NULL,
    `proceso_origen` VARCHAR(191) NULL,
    `proceso_destino` VARCHAR(191) NULL,
    `observacion` VARCHAR(191) NULL,
    `campo_modificado` VARCHAR(191) NULL,
    `dato_antiguo` VARCHAR(191) NULL,
    `dato_nuevo` VARCHAR(191) NULL,
    `requirente` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requirentes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `requirentes_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pac` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `servicio` VARCHAR(191) NOT NULL,
    `supra_servicio` VARCHAR(191) NOT NULL,
    `bodega` VARCHAR(191) NOT NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `detalle` VARCHAR(191) NOT NULL,
    `unidad_medida` VARCHAR(191) NOT NULL,
    `costo_unitario` DOUBLE NOT NULL,
    `cantidad_anual` INTEGER NOT NULL,
    `enero` INTEGER NOT NULL DEFAULT 0,
    `febrero` INTEGER NOT NULL DEFAULT 0,
    `marzo` INTEGER NOT NULL DEFAULT 0,
    `abril` INTEGER NOT NULL DEFAULT 0,
    `mayo` INTEGER NOT NULL DEFAULT 0,
    `junio` INTEGER NOT NULL DEFAULT 0,
    `julio` INTEGER NOT NULL DEFAULT 0,
    `agosto` INTEGER NOT NULL DEFAULT 0,
    `septiembre` INTEGER NOT NULL DEFAULT 0,
    `octubre` INTEGER NOT NULL DEFAULT 0,
    `noviembre` INTEGER NOT NULL DEFAULT 0,
    `diciembre` INTEGER NOT NULL DEFAULT 0,
    `mensual` DOUBLE NOT NULL DEFAULT 0,
    `ano_pac` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requerimiento_abastecimiento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'Pendiente',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `producto_requerimiento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_requerimiento_id` INTEGER NOT NULL,
    `nombre_producto` VARCHAR(191) NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `cantidad_programada` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_requerimiento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_requerimiento_id` INTEGER NOT NULL,
    `accion` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `novedades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titular` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `imagen` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `formato_bases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `tipo_base` VARCHAR(191) NOT NULL,
    `documento` VARCHAR(191) NULL,
    `nombre_archivo` VARCHAR(191) NULL,
    `ruta_archivo` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `licitaciones_mp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo_externo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `codigo_estado` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `codigo_tipo` INTEGER NULL,
    `moneda` VARCHAR(191) NULL DEFAULT 'CLP',
    `etapas` INTEGER NULL DEFAULT 1,
    `modalidad` INTEGER NULL DEFAULT 1,
    `monto_estimado` DOUBLE NULL,
    `monto_adjudicado` DOUBLE NULL,
    `tiempo_duracion` VARCHAR(191) NULL,
    `unidad_tiempo_duracion` INTEGER NULL,
    `fecha_creacion_mp` DATETIME(3) NULL,
    `fecha_publicacion` DATETIME(3) NULL,
    `fecha_cierre` DATETIME(3) NULL,
    `fecha_adjudicacion` DATETIME(3) NULL,
    `fecha_inicio` DATETIME(3) NULL,
    `fecha_final` DATETIME(3) NULL,
    `adjudicacion_tipo` INTEGER NULL,
    `adjudicacion_numero` VARCHAR(191) NULL,
    `adjudicacion_num_oferentes` INTEGER NULL,
    `adjudicacion_url_acta` TEXT NULL,
    `codigo_organismo` VARCHAR(191) NULL,
    `nombre_organismo` VARCHAR(191) NULL,
    `rut_unidad` VARCHAR(191) NULL,
    `codigo_unidad` VARCHAR(191) NULL,
    `nombre_unidad` VARCHAR(191) NULL,
    `direccion_unidad` VARCHAR(191) NULL,
    `comuna_unidad` VARCHAR(191) NULL,
    `region_unidad` VARCHAR(191) NULL,
    `nombre_usuario` VARCHAR(191) NULL,
    `cargo_usuario` VARCHAR(191) NULL,
    `requirente` VARCHAR(191) NOT NULL,
    `vigencia_meses` INTEGER NULL,
    `monto_consumido` DOUBLE NOT NULL DEFAULT 0,
    `porcentaje_consumo` DOUBLE NOT NULL DEFAULT 0,
    `alerta_enviada_50` BOOLEAN NOT NULL DEFAULT false,
    `alerta_enviada_75` BOOLEAN NOT NULL DEFAULT false,
    `alerta_enviada_90` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `licitaciones_mp_codigo_externo_key`(`codigo_externo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items_licitacion_mp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_licitacion_mp_id` INTEGER NOT NULL,
    `correlativo` INTEGER NOT NULL,
    `codigo_producto` INTEGER NOT NULL,
    `codigo_categoria` VARCHAR(191) NOT NULL,
    `categoria` TEXT NULL,
    `nombre_producto` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `unidad_medida` VARCHAR(191) NOT NULL,
    `cantidad_total` DOUBLE NOT NULL,
    `cantidad_adjudicada` DOUBLE NULL,
    `cantidad_consumida` DOUBLE NOT NULL DEFAULT 0,
    `monto_unitario` DOUBLE NOT NULL,
    `monto_total` DOUBLE NOT NULL,
    `rut_proveedor` VARCHAR(191) NULL,
    `nombre_proveedor` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordenes_compra_mp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_licitacion_mp_id` INTEGER NULL,
    `codigo_licitacion` VARCHAR(191) NULL,
    `codigo` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `codigo_estado` INTEGER NOT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `codigo_tipo` VARCHAR(191) NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `tipo_moneda` VARCHAR(191) NULL DEFAULT 'CLP',
    `codigo_estado_proveedor` INTEGER NULL,
    `estado_proveedor` VARCHAR(191) NULL,
    `descuentos` DOUBLE NOT NULL DEFAULT 0,
    `cargos` DOUBLE NOT NULL DEFAULT 0,
    `total_neto` DOUBLE NOT NULL,
    `porcentaje_iva` DOUBLE NULL DEFAULT 19,
    `impuestos` DOUBLE NOT NULL,
    `total` DOUBLE NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL,
    `fecha_envio` DATETIME(3) NULL,
    `fecha_aceptacion` DATETIME(3) NULL,
    `fecha_cancelacion` DATETIME(3) NULL,
    `fecha_ultima_modificacion` DATETIME(3) NULL,
    `financiamiento` VARCHAR(191) NULL,
    `tipo_despacho` VARCHAR(191) NULL,
    `forma_pago` VARCHAR(191) NULL,
    `codigo_organismo` VARCHAR(191) NULL,
    `nombre_organismo` VARCHAR(191) NULL,
    `rut_unidad` VARCHAR(191) NULL,
    `nombre_unidad` VARCHAR(191) NULL,
    `direccion_unidad` VARCHAR(191) NULL,
    `comuna_unidad` VARCHAR(191) NULL,
    `nombre_contacto` VARCHAR(191) NULL,
    `cargo_contacto` VARCHAR(191) NULL,
    `codigo_proveedor` VARCHAR(191) NULL,
    `rut_proveedor` VARCHAR(191) NULL,
    `nombre_proveedor` VARCHAR(191) NULL,
    `direccion_proveedor` VARCHAR(191) NULL,
    `comuna_proveedor` VARCHAR(191) NULL,
    `region_proveedor` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ordenes_compra_mp_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items_orden_compra_mp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_orden_compra_id` INTEGER NOT NULL,
    `fk_item_licitacion_mp_id` INTEGER NULL,
    `correlativo` INTEGER NOT NULL,
    `codigo_categoria` INTEGER NOT NULL,
    `categoria` TEXT NULL,
    `codigo_producto` INTEGER NOT NULL,
    `producto` VARCHAR(191) NOT NULL,
    `especificacion_comprador` TEXT NULL,
    `especificacion_proveedor` TEXT NULL,
    `cantidad` DOUBLE NOT NULL,
    `unidad` VARCHAR(191) NULL,
    `moneda` VARCHAR(191) NULL DEFAULT 'CLP',
    `precio_neto` DOUBLE NOT NULL,
    `total_descuentos` DOUBLE NOT NULL DEFAULT 0,
    `total_cargos` DOUBLE NOT NULL DEFAULT 0,
    `total_impuestos` DOUBLE NOT NULL DEFAULT 0,
    `total` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alertas_consumo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fk_licitacion_mp_id` INTEGER NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `porcentaje` DOUBLE NOT NULL,
    `mensaje` TEXT NOT NULL,
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `proceso_licitacion` ADD CONSTRAINT `proceso_licitacion_fk_formato_liquidacion_id_fkey` FOREIGN KEY (`fk_formato_liquidacion_id`) REFERENCES `formato_liquidacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `licitaciones` ADD CONSTRAINT `licitaciones_fk_formato_liquidacion_id_fkey` FOREIGN KEY (`fk_formato_liquidacion_id`) REFERENCES `formato_liquidacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `licitaciones` ADD CONSTRAINT `licitaciones_fk_usuario_id_fkey` FOREIGN KEY (`fk_usuario_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `licitaciones` ADD CONSTRAINT `licitaciones_fk_proceso_actual_id_fkey` FOREIGN KEY (`fk_proceso_actual_id`) REFERENCES `proceso_licitacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos_licitacion` ADD CONSTRAINT `documentos_licitacion_fk_licitacion_id_fkey` FOREIGN KEY (`fk_licitacion_id`) REFERENCES `licitaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos_licitacion` ADD CONSTRAINT `documentos_licitacion_fk_usuario_id_fkey` FOREIGN KEY (`fk_usuario_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_licitacion` ADD CONSTRAINT `historial_licitacion_fk_licitacion_id_fkey` FOREIGN KEY (`fk_licitacion_id`) REFERENCES `licitaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_licitacion` ADD CONSTRAINT `historial_licitacion_fk_usuario_id_fkey` FOREIGN KEY (`fk_usuario_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `producto_requerimiento` ADD CONSTRAINT `producto_requerimiento_fk_requerimiento_id_fkey` FOREIGN KEY (`fk_requerimiento_id`) REFERENCES `requerimiento_abastecimiento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_requerimiento` ADD CONSTRAINT `historial_requerimiento_fk_requerimiento_id_fkey` FOREIGN KEY (`fk_requerimiento_id`) REFERENCES `requerimiento_abastecimiento`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items_licitacion_mp` ADD CONSTRAINT `items_licitacion_mp_fk_licitacion_mp_id_fkey` FOREIGN KEY (`fk_licitacion_mp_id`) REFERENCES `licitaciones_mp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes_compra_mp` ADD CONSTRAINT `ordenes_compra_mp_fk_licitacion_mp_id_fkey` FOREIGN KEY (`fk_licitacion_mp_id`) REFERENCES `licitaciones_mp`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items_orden_compra_mp` ADD CONSTRAINT `items_orden_compra_mp_fk_orden_compra_id_fkey` FOREIGN KEY (`fk_orden_compra_id`) REFERENCES `ordenes_compra_mp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items_orden_compra_mp` ADD CONSTRAINT `items_orden_compra_mp_fk_item_licitacion_mp_id_fkey` FOREIGN KEY (`fk_item_licitacion_mp_id`) REFERENCES `items_licitacion_mp`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alertas_consumo` ADD CONSTRAINT `alertas_consumo_fk_licitacion_mp_id_fkey` FOREIGN KEY (`fk_licitacion_mp_id`) REFERENCES `licitaciones_mp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
