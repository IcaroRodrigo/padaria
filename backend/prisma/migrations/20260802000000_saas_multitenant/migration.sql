-- ============================================================
-- MIGRAÇÃO SaaS MULTI-TENANT — Casa Granella
-- Estratégia segura para dados em produção:
--   1. Criar novas tabelas
--   2. Adicionar colunas como NULLABLE
--   3. Popular com dados da empresa existente (id=1)
--   4. Tornar NOT NULL
--   5. Adicionar constraints e índices
-- ============================================================

-- ─── 1. CRIAR TABELA EMPRESA ───────────────────────────────────────────────

CREATE TABLE `Empresa` (
    `id`                 INTEGER NOT NULL AUTO_INCREMENT,
    `nome`               VARCHAR(191) NOT NULL,
    `email`              VARCHAR(191) NOT NULL,
    `cnpj`               VARCHAR(191) NULL,
    `telefone`           VARCHAR(191) NULL,
    `ativo`              BOOLEAN NOT NULL DEFAULT true,
    `trialExpiraEm`      DATETIME(3) NOT NULL,
    `assinaturaExpiraEm` DATETIME(3) NULL,
    `criadaEm`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `Empresa_email_key` ON `Empresa`(`email`);

-- Casa Granella = empresa id=1 (trial permanente para cliente existente)
INSERT INTO `Empresa` (`id`, `nome`, `email`, `cnpj`, `ativo`, `trialExpiraEm`)
VALUES (1, 'Casa Granella', 'admin@casagranella.com', NULL, true, '2099-12-31 23:59:59.000');

-- ─── 2. CRIAR TABELAS NOVAS ────────────────────────────────────────────────

CREATE TABLE `SolicitacaoAssinatura` (
    `id`             INTEGER NOT NULL AUTO_INCREMENT,
    `empresaId`      INTEGER NOT NULL,
    `status`         ENUM('PENDENTE', 'APROVADO', 'REJEITADO') NOT NULL DEFAULT 'PENDENTE',
    `comprovanteUrl` TEXT NULL,
    `valorPago`      DECIMAL(10, 2) NULL,
    `criadoEm`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processadoEm`   DATETIME(3) NULL,
    `processadoPor`  INTEGER NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TokenResetSenha` (
    `id`        INTEGER NOT NULL AUTO_INCREMENT,
    `token`     VARCHAR(191) NOT NULL,
    `email`     VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usado`     BOOLEAN NOT NULL DEFAULT false,
    `criadoEm`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `TokenResetSenha_token_key` ON `TokenResetSenha`(`token`);

-- ─── 3. ADICIONAR SUPER_ADMIN AO ENUM Role ─────────────────────────────────

ALTER TABLE `User` MODIFY `role` ENUM('SUPER_ADMIN', 'ADMIN', 'OPERATOR') NOT NULL DEFAULT 'OPERATOR';

-- ─── 4. ADICIONAR empresaId COMO NULLABLE EM TODOS OS MODELS ───────────────

ALTER TABLE `User`            ADD COLUMN `empresaId` INTEGER NULL;
ALTER TABLE `Product`         ADD COLUMN `empresaId` INTEGER NULL;
ALTER TABLE `Category`        ADD COLUMN `empresaId` INTEGER NULL;
ALTER TABLE `Supplier`        ADD COLUMN `empresaId` INTEGER NULL;
ALTER TABLE `Customer`        ADD COLUMN `empresaId` INTEGER NULL;
ALTER TABLE `CashRegister`    ADD COLUMN `empresaId` INTEGER NULL;
ALTER TABLE `Sale`            ADD COLUMN `empresaId` INTEGER NULL;
ALTER TABLE `Expense`         ADD COLUMN `empresaId` INTEGER NULL;
ALTER TABLE `ExpenseCategory` ADD COLUMN `empresaId` INTEGER NULL;
ALTER TABLE `StockEntry`      ADD COLUMN `empresaId` INTEGER NULL;

-- Setting: remover índice único atual em `key` e preparar para composto
ALTER TABLE `Setting` DROP INDEX `Setting_key_key`;
ALTER TABLE `Setting` ADD COLUMN `empresaId` INTEGER NULL;

-- ─── 5. POPULAR TODOS OS REGISTROS EXISTENTES COM empresaId = 1 ────────────

UPDATE `User`            SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `Product`         SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `Category`        SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `Supplier`        SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `Customer`        SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `CashRegister`    SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `Sale`            SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `Expense`         SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `ExpenseCategory` SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `StockEntry`      SET `empresaId` = 1 WHERE `empresaId` IS NULL;
UPDATE `Setting`         SET `empresaId` = 1 WHERE `empresaId` IS NULL;

-- ─── 6. TORNAR NOT NULL (exceto User.empresaId que pode ser NULL para SUPER_ADMIN) ─

ALTER TABLE `Product`         MODIFY `empresaId` INTEGER NOT NULL;
ALTER TABLE `Category`        MODIFY `empresaId` INTEGER NOT NULL;
ALTER TABLE `Supplier`        MODIFY `empresaId` INTEGER NOT NULL;
ALTER TABLE `Customer`        MODIFY `empresaId` INTEGER NOT NULL;
ALTER TABLE `CashRegister`    MODIFY `empresaId` INTEGER NOT NULL;
ALTER TABLE `Sale`            MODIFY `empresaId` INTEGER NOT NULL;
ALTER TABLE `Expense`         MODIFY `empresaId` INTEGER NOT NULL;
ALTER TABLE `ExpenseCategory` MODIFY `empresaId` INTEGER NOT NULL;
ALTER TABLE `StockEntry`      MODIFY `empresaId` INTEGER NOT NULL;
ALTER TABLE `Setting`         MODIFY `empresaId` INTEGER NOT NULL;

-- ─── 7. CRIAR ÍNDICE COMPOSTO PARA Setting ─────────────────────────────────

CREATE UNIQUE INDEX `Setting_empresaId_key_key` ON `Setting`(`empresaId`, `key`);

-- ─── 8. ADICIONAR FOREIGN KEYS ─────────────────────────────────────────────

ALTER TABLE `SolicitacaoAssinatura` ADD CONSTRAINT `SolicitacaoAssinatura_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `User` ADD CONSTRAINT `User_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Product` ADD CONSTRAINT `Product_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Category` ADD CONSTRAINT `Category_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Customer` ADD CONSTRAINT `Customer_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CashRegister` ADD CONSTRAINT `CashRegister_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Sale` ADD CONSTRAINT `Sale_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Expense` ADD CONSTRAINT `Expense_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ExpenseCategory` ADD CONSTRAINT `ExpenseCategory_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `StockEntry` ADD CONSTRAINT `StockEntry_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Setting` ADD CONSTRAINT `Setting_empresaId_fkey`
    FOREIGN KEY (`empresaId`) REFERENCES `Empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
