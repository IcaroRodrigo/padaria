-- CreateTable
CREATE TABLE `FiscalNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `saleId` INTEGER NOT NULL,
    `ref` VARCHAR(191) NOT NULL,
    `cpfDestinatario` VARCHAR(191) NULL,
    `status` ENUM('PROCESSING', 'AUTHORIZED', 'DENIED', 'CANCELLED', 'ERROR') NOT NULL DEFAULT 'PROCESSING',
    `chaveAcesso` VARCHAR(191) NULL,
    `nsu` VARCHAR(191) NULL,
    `numeroNota` INTEGER NULL,
    `serie` VARCHAR(191) NULL,
    `danfeUrl` TEXT NULL,
    `errorMessage` TEXT NULL,
    `ambiente` VARCHAR(191) NOT NULL DEFAULT 'homologacao',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FiscalNote_saleId_key`(`saleId`),
    UNIQUE INDEX `FiscalNote_ref_key`(`ref`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FiscalNote` ADD CONSTRAINT `FiscalNote_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
