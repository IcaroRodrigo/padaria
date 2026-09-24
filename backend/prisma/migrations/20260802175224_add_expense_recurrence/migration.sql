-- AlterTable
ALTER TABLE `Expense` ADD COLUMN `generatedFromId` INTEGER NULL,
    ADD COLUMN `recurrenceDay` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_generatedFromId_fkey` FOREIGN KEY (`generatedFromId`) REFERENCES `Expense`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
