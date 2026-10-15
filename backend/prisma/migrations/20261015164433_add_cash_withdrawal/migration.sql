-- DropForeignKey
ALTER TABLE `FiscalNote` DROP FOREIGN KEY `FiscalNote_saleId_fkey`;

-- AlterTable
ALTER TABLE `FiscalNote` ADD COLUMN `cashRegisterId` INTEGER NULL,
    ADD COLUMN `qrcodeUrl` TEXT NULL,
    MODIFY `saleId` INTEGER NULL;

-- CreateTable
CREATE TABLE `cash_withdrawals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cashRegisterId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `empresaId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `motivo` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cash_withdrawals` ADD CONSTRAINT `cash_withdrawals_cashRegisterId_fkey` FOREIGN KEY (`cashRegisterId`) REFERENCES `CashRegister`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_withdrawals` ADD CONSTRAINT `cash_withdrawals_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cash_withdrawals` ADD CONSTRAINT `cash_withdrawals_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FiscalNote` ADD CONSTRAINT `FiscalNote_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `Sale`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FiscalNote` ADD CONSTRAINT `FiscalNote_cashRegisterId_fkey` FOREIGN KEY (`cashRegisterId`) REFERENCES `CashRegister`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
