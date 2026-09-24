/**
 * Testes E2E — Módulo: Edição de Produtos
 *
 * Cobertura:
 *   - Happy Path: abrir modal, pré-carga de dados, salvar alterações
 *   - Edge Cases: editar campos opcionais, limpar campos, troca de unidade
 *   - Sad Path: salvar sem campos obrigatórios, erro de duplicata ao editar
 *   - Regressão: produto editado reflete na listagem sem refresh manual
 */

import { test, expect } from '../../fixtures/auth.fixture'
import { ProdutosPage } from '../../pages/ProdutosPage'

const uid = () => Date.now().toString().slice(-6)
const DATE_FUTURE = '2027-12-31'

// Helper: cria produto base para os testes de edição
async function criarProduto(
  produtosPage: ProdutosPage,
  overrides: Partial<Parameters<ProdutosPage['createProduct']>[0]> = {},
) {
  const nome = `Produto Edição ${uid()}`
  await produtosPage.createProduct({
    name: nome,
    categoryId: '1',   // Chás e Ervas
    unit: 'kg',
    costPrice: '30.00',
    salePrice: '50.00',
    barcode: `ED${uid()}`,
    description: 'Descrição original',
    expirationDate: DATE_FUTURE,
    stockQty: '5.000',
    minStockQty: '1.000',
    ...overrides,
  })
  return nome
}

test.describe('Edição de Produtos — Happy Path', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-020 — deve abrir modal com título "Editar Produto"', async () => {
    const nome = await criarProduto(produtosPage)
    await produtosPage.openEditModal(nome)

    await expect(produtosPage.modalTitle()).toHaveText('Editar Produto')
  })

  test('TC-021 — deve pré-carregar o nome do produto no formulário', async () => {
    const nome = await criarProduto(produtosPage)
    await produtosPage.openEditModal(nome)

    await expect(produtosPage.fieldName()).toHaveValue(nome)
  })

  test('TC-022 — deve pré-carregar preço de custo e venda', async () => {
    const nome = await criarProduto(produtosPage)
    await produtosPage.openEditModal(nome)

    await expect(produtosPage.fieldCostPrice()).toHaveValue('30,00')
    await expect(produtosPage.fieldSalePrice()).toHaveValue('50,00')
  })

  test('TC-023 — deve pré-carregar a descrição', async () => {
    const nome = await criarProduto(produtosPage)
    await produtosPage.openEditModal(nome)

    await expect(produtosPage.fieldDescription()).toHaveValue('Descrição original')
  })

  test('TC-024 — deve pré-carregar estoque atual e mínimo', async () => {
    const nome = await criarProduto(produtosPage)
    await produtosPage.openEditModal(nome)

    await expect(produtosPage.fieldStockQty()).toHaveValue('5')
    await expect(produtosPage.fieldMinStockQty()).toHaveValue('1')
  })

  test('TC-025 — deve exibir botão "Salvar alterações" no modal de edição', async () => {
    const nome = await criarProduto(produtosPage)
    await produtosPage.openEditModal(nome)

    await expect(produtosPage.submitButton()).toHaveText('Salvar alterações')
  })

  test('TC-026 — deve salvar alteração do nome e refletir na tabela', async () => {
    const nomeOriginal = await criarProduto(produtosPage)
    // Nome completamente diferente — NÃO pode ser substring do original
    const nomeNovo = `PRODUTO RENOMEADO ${uid()}`

    await produtosPage.openEditModal(nomeOriginal)
    await produtosPage.fieldName().clear()
    await produtosPage.fieldName().fill(nomeNovo)
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    await expect(produtosPage.rowByName(nomeNovo)).toBeVisible()
    await expect(produtosPage.rowByName(nomeOriginal)).toBeHidden()
  })

  test('TC-027 — deve salvar alteração de preço e atualizar margem na tabela', async () => {
    const nome = await criarProduto(produtosPage)

    await produtosPage.openEditModal(nome)
    await produtosPage.fieldCostPrice().fill('20.00')
    await produtosPage.fieldSalePrice().fill('40.00')
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    // calcMargin = ((sale-cost)/sale)*100 → ((40-20)/40)*100 = 50.0%
    const row = produtosPage.rowByName(nome)
    await expect(row).toContainText('50.0%')
  })

  test('TC-028 — deve atualizar margem em tempo real ao editar preços no modal', async () => {
    const nome = await criarProduto(produtosPage)

    await produtosPage.openEditModal(nome)
    await produtosPage.fieldCostPrice().fill('10.00')
    await produtosPage.fieldSalePrice().fill('30.00')

    // calcMargin = ((sale-cost)/sale)*100 → ((30-10)/30)*100 = 66.7%
    await expect(produtosPage.marginDisplay()).toContainText('66.7%')
  })

  test('TC-029 — deve salvar alteração de descrição', async () => {
    const nome = await criarProduto(produtosPage)
    const descNova = 'Nova descrição atualizada via teste E2E'

    await produtosPage.openEditModal(nome)
    await produtosPage.fieldDescription().clear()
    await produtosPage.fieldDescription().fill(descNova)
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    // Reabre o modal para verificar a descrição salva
    await produtosPage.openEditModal(nome)
    await expect(produtosPage.fieldDescription()).toHaveValue(descNova)
  })

  test('TC-030 — deve salvar alteração de data de validade e persistir no modal', async () => {
    const nome = await criarProduto(produtosPage)

    await produtosPage.openEditModal(nome)
    await produtosPage.fieldExpirationDate().fill('2027-06-30')
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    // Reabre o modal para verificar o valor salvo (evita ambiguidade de timezone na tabela)
    await produtosPage.openEditModal(nome)
    const dateValue = await produtosPage.fieldExpirationDate().inputValue()
    expect(dateValue).toBe('2027-06-30')
  })
})

test.describe('Edição de Produtos — Edge Cases', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-031 — deve permitir troca de categoria do produto', async () => {
    const nome = await criarProduto(produtosPage)

    await produtosPage.openEditModal(nome)
    await produtosPage.fieldCategory().selectOption({ value: '3' }) // Suplementos
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    await expect(produtosPage.rowByName(nome)).toContainText('Suplementos')
  })

  test('TC-032 — deve permitir troca de unidade de medida', async () => {
    const nome = await criarProduto(produtosPage)

    await produtosPage.openEditModal(nome)
    await produtosPage.fieldUnit().selectOption('litro')
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    await expect(produtosPage.rowByName(nome)).toContainText('litro')
  })

  test('TC-033 — deve permitir alterar código de barras de um produto existente', async () => {
    // Nota: criar produto sem barcode dispara Bug #2 (barcode:"" viola UNIQUE constraint).
    // Workaround: produto já criado com barcode pelo helper criarProduto(), testamos a troca.
    const nome = await criarProduto(produtosPage)
    const novoCodigo = `BAR${uid()}`

    await produtosPage.openEditModal(nome)
    await produtosPage.fieldBarcode().clear()
    await produtosPage.fieldBarcode().fill(novoCodigo)
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    await expect(produtosPage.rowByName(nome).getByText(novoCodigo)).toBeVisible()
  })

  test('TC-034 — deve atualizar estoque ao editar', async () => {
    const nome = await criarProduto(produtosPage)

    await produtosPage.openEditModal(nome)
    await produtosPage.fieldStockQty().fill('25.750')
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    // Reabre e confere o valor salvo
    await produtosPage.openEditModal(nome)
    await expect(produtosPage.fieldStockQty()).toHaveValue('25.75')
  })
})

test.describe('Edição de Produtos — Sad Path', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-035 — deve bloquear salvar com nome apagado', async () => {
    const nome = await criarProduto(produtosPage)

    await produtosPage.openEditModal(nome)
    await produtosPage.fieldName().clear()
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.modal().getByText('Nome é obrigatório')).toBeVisible()
  })

  test('TC-036 — deve exibir erro ao tentar usar barcode já existente em outro produto', async () => {
    const barcode = `DUPEDIT${uid()}`

    const nomeA = await criarProduto(produtosPage, { barcode })
    const nomeB = `Produto B Edicao ${uid()}`
    await produtosPage.createProduct({
      name: nomeB,
      categoryId: '2',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: `TC036B${uid()}`,   // workaround Bug #2
      expirationDate: DATE_FUTURE,
    })

    // Tenta colocar o barcode do produto A no produto B
    await produtosPage.openEditModal(nomeB)
    await produtosPage.fieldBarcode().fill(barcode)
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.formError()).toBeVisible()
  })

  test('TC-036b — deve bloquear edição que atribui PLU já em uso por outro produto', async () => {
    const plu = String(Math.floor(Math.random() * 90000) + 10000)

    // Produto A: criado com o PLU
    await criarProduto(produtosPage, { plu })

    // Produto B: criado sem PLU
    const nomeB = `Produto B PLU Edit ${uid()}`
    await produtosPage.createProduct({
      name: nomeB,
      categoryId: '2',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: `TC036bB${uid()}`,   // workaround Bug #2
      expirationDate: DATE_FUTURE,
    })

    // Tenta colocar o PLU do produto A no produto B
    await produtosPage.openEditModal(nomeB)
    await produtosPage.fieldPlu().fill(plu)
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.formError()).toBeVisible()
    await expect(produtosPage.formError()).toContainText(`PLU ${plu}`)
  })
})

test.describe('Edição de Produtos — Toggle Ativo/Inativo', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-037 — deve desativar produto ativo ao clicar em "Desativar"', async () => {
    const nome = await criarProduto(produtosPage)

    const row = produtosPage.rowByName(nome)
    await expect(row.getByText('Ativo')).toBeVisible()

    await produtosPage.toggleButtonForRow(nome).click()
    await row.waitFor()

    await expect(row.getByText('Inativo')).toBeVisible()
  })

  test('TC-038 — deve reativar produto inativo ao clicar em "Ativar"', async () => {
    const nome = await criarProduto(produtosPage)

    // Desativa
    await produtosPage.toggleButtonForRow(nome).click()
    await produtosPage.rowByName(nome).waitFor()

    // Reativa
    await produtosPage.toggleButtonForRow(nome).click()
    await produtosPage.rowByName(nome).waitFor()

    await expect(produtosPage.rowByName(nome).getByText('Ativo')).toBeVisible()
  })
})
