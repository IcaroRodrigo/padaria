-- AlterTable: add plu column to Product
ALTER TABLE `Product` ADD COLUMN `plu` INTEGER NULL;
ALTER TABLE `Product` ADD UNIQUE INDEX `Product_plu_key`(`plu`);

-- CreateTable: Setting
CREATE TABLE `Setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Setting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
