-- PLU deixa de ser único globalmente e passa a ser único por empresa
DROP INDEX `Product_plu_key` ON `Product`;
CREATE UNIQUE INDEX `Product_plu_empresaId_key` ON `Product`(`plu`, `empresaId`);
