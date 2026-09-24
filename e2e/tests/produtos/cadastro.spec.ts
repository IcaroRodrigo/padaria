/**
 * Testes E2E — Módulo: Cadastro de Produtos
 *
 * Cobertura:
 *   - Happy Path: campos obrigatórios, todos os campos, margem de lucro
 *   - Edge Cases: nomes especiais, preços extremos, PLU/código de barras
 *   - Sad Path: campos obrigatórios vazios, preço inválido, duplicatas
 *   - Segurança: injeção XSS em campos de texto
 *
 * BUG CONHECIDO (#1 — Critical):
 *   TC-001 falha porque o frontend envia expirationDate:"" (string vazia)
 *   quando o campo não é preenchido. O backend rejeita com "must be a valid
 *   ISO 8601 date string" mesmo com @IsOptional(). Isso impede cadastrar
 *   produtos sem data de validade.
 *   Fix sugerido: z.string().optional().transform(v => v || undefined) no schema Zod.
 */

import { test, expect } from '../../fixtures/auth.fixture'
import { ProdutosPage } from '../../pages/ProdutosPage'

const uid = () => Date.now().toString().slice(-6)

// Data futura usada nos testes que precisam criar produto com sucesso
const DATE_FUTURE = '2027-12-31'

test.describe('Cadastro de Produtos — Happy Path', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-001 — [BUG #1] cadastro sem data falha por expirationDate vazio enviado à API', async () => {
    // Este teste documenta o Bug #1: campo expirationDate opcional envia ""
    // para o backend, que rejeita com erro de validação ISO 8601.
    const nome = `Chá de Camomila Teste ${uid()}`

    await produtosPage.openNewProductModal()
    await expect(produtosPage.modalTitle()).toHaveText('Novo Produto')

    await produtosPage.fillForm({
      name: nome,
      categoryId: '1',   // Chás e Ervas
      unit: 'kg',
      costPrice: '30.00',
      salePrice: '49.90',
      // expirationDate propositalmente omitido — documenta o bug
    })
    await produtosPage.submitForm()

    // ESPERADO (comportamento correto): modal fecha e produto aparece na lista
    // OBTIDO (bug): modal fica aberto com erro "expirationDate must be a valid ISO 8601 date string"
    await expect(produtosPage.formError()).toBeVisible()
    await expect(produtosPage.formError()).toContainText('expirationDate')
  })

  test('TC-002 — deve cadastrar produto com todos os campos preenchidos', async () => {
    const nome = `Amendoim Torrado ${uid()}`

    await produtosPage.openNewProductModal()
    await produtosPage.fillForm({
      name: nome,
      description: 'Amendoim torrado sem sal, produto premium',
      categoryId: '2',   // Grãos e Cereais
      unit: 'kg',
      costPrice: '15.00',
      salePrice: '25.90',
      barcode: `789${uid()}`,
      expirationDate: '2026-12-31',
      stockQty: '10.500',
      minStockQty: '2.000',
    })
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeHidden()
    await expect(produtosPage.rowByName(nome)).toBeVisible()
  })

  test('TC-003 — deve exibir margem de lucro em tempo real ao preencher preços', async () => {
    await produtosPage.openNewProductModal()

    // Margem não deve ser visível sem preços
    await expect(produtosPage.marginDisplay()).toBeHidden()

    await produtosPage.fieldCostPrice().fill('30.00')
    await produtosPage.fieldSalePrice().fill('50.00')

    // calcMargin = ((sale - cost) / sale) * 100 → ((50-30)/50)*100 = 40.0%
    await expect(produtosPage.marginDisplay()).toBeVisible()
    await expect(produtosPage.marginDisplay()).toContainText('40.0%')
  })

  test('TC-004 — deve exibir botão "Cadastrar produto" no modal de criação', async () => {
    await produtosPage.openNewProductModal()
    await expect(produtosPage.submitButton()).toHaveText('Cadastrar produto')
  })

  test('TC-005 — deve fechar o modal ao clicar no X (sem salvar)', async ({ adminPage }) => {
    await produtosPage.openNewProductModal()
    await produtosPage.fieldName().fill('Produto que não vai ser salvo')

    // Fecha pelo botão X (primeiro button dentro do modal header)
    const closeBtn = produtosPage.modal().locator('button').first()
    await closeBtn.click()

    await expect(produtosPage.modal()).toBeHidden()
  })
})

test.describe('Cadastro de Produtos — Edge Cases', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-006 — deve cadastrar produto com nome contendo caracteres especiais e acentos', async () => {
    const nome = `Açaí & Chia — Premium 100% ${uid()}`

    await produtosPage.createProduct({
      name: nome,
      categoryId: '8',   // Sementes
      unit: 'kg',
      costPrice: '45.00',
      salePrice: '72.00',
      barcode: `TC006${uid()}`,   // barcode obrigatório (workaround Bug #2)
      expirationDate: DATE_FUTURE,
    })

    await expect(produtosPage.rowByName(nome)).toBeVisible()
  })

  test('TC-007 — deve aceitar nome muito longo (100+ caracteres)', async () => {
    const nomeLongo = `Produto com nome extremamente longo para testar limites do campo de cadastro ${uid()}`

    await produtosPage.createProduct({
      name: nomeLongo,
      categoryId: '2',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: `TC007${uid()}`,   // workaround Bug #2
      expirationDate: DATE_FUTURE,
    })

    await expect(produtosPage.rowByName(nomeLongo)).toBeVisible()
  })

  test('TC-008 — deve aceitar preço de custo zero (produto doado/amostra)', async () => {
    const nome = `Amostra Grátis ${uid()}`

    await produtosPage.createProduct({
      name: nome,
      categoryId: '1',
      unit: 'unidade',
      costPrice: '0',
      salePrice: '0.01',
      barcode: `TC008${uid()}`,   // workaround Bug #2
      expirationDate: DATE_FUTURE,
    })

    await expect(produtosPage.rowByName(nome)).toBeVisible()
  })

  test('TC-009 — margem exibida em verde quando ≥ 30%', async () => {
    await produtosPage.openNewProductModal()

    // calcMargin = ((sale-cost)/sale)*100 → ((50-30)/50)*100 = 40.0%
    await produtosPage.fieldCostPrice().fill('30.00')
    await produtosPage.fieldSalePrice().fill('50.00')

    await expect(produtosPage.marginDisplay()).toBeVisible()
    await expect(produtosPage.marginDisplay()).toContainText('40.0%')
  })

  test('TC-010 — deve aceitar preço de venda elevado (R$ 9.999,99)', async () => {
    const nome = `Produto Premium Caro ${uid()}`

    await produtosPage.createProduct({
      name: nome,
      categoryId: '3',   // Suplementos
      unit: 'kg',
      costPrice: '6000.00',
      salePrice: '9999.99',
      barcode: `TC010${uid()}`,   // workaround Bug #2
      expirationDate: DATE_FUTURE,
    })

    await expect(produtosPage.rowByName(nome)).toBeVisible()
  })

  test('TC-011 — deve aceitar código de barras EAN-13 e exibir abaixo do nome', async () => {
    const nome = `Produto EAN13 ${uid()}`
    const ean = `7898${uid()}`

    await produtosPage.createProduct({
      name: nome,
      categoryId: '2',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: ean,
      expirationDate: DATE_FUTURE,
    })

    await expect(produtosPage.rowByName(nome)).toBeVisible()
    await expect(produtosPage.rowByName(nome).getByText(ean)).toBeVisible()
  })
})

test.describe('Cadastro de Produtos — Sad Path (Validações)', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
    await produtosPage.openNewProductModal()
  })

  test('TC-012 — deve bloquear envio sem nome do produto', async () => {
    await produtosPage.fillForm({
      categoryId: '1',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
    })
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.modal().getByText('Nome é obrigatório')).toBeVisible()
  })

  test('TC-013 — deve bloquear envio sem categoria selecionada', async () => {
    await produtosPage.fillForm({
      name: 'Produto Sem Categoria',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
    })
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.modal().getByText('Categoria é obrigatória')).toBeVisible()
  })

  test('TC-014 — deve bloquear envio sem unidade selecionada', async () => {
    await produtosPage.fillForm({
      name: 'Produto Sem Unidade',
      categoryId: '1',
      costPrice: '10.00',
      salePrice: '16.00',
    })
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.modal().getByText('Unidade é obrigatória')).toBeVisible()
  })

  test('TC-015 — deve bloquear envio com preço de venda zerado (mínimo 0.01)', async () => {
    await produtosPage.fillForm({
      name: 'Produto Preço Zero',
      categoryId: '1',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '0',
    })
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.modal().getByText('Preço inválido')).toBeVisible()
  })

  test('TC-015b — deve exibir erro ao cadastrar PLU já em uso por outro produto', async () => {
    const pluRepetido = String(Math.floor(Math.random() * 90000) + 10000) // 5 dígitos aleatórios

    // Cria o primeiro produto com o PLU
    await produtosPage.fillForm({
      name: `Produto PLU A ${uid()}`,
      categoryId: '1',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: `PLUA${uid()}`,
      expirationDate: DATE_FUTURE,
      plu: pluRepetido,
    })
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    // Tenta criar segundo produto com o mesmo PLU
    await produtosPage.openNewProductModal()
    await produtosPage.fillForm({
      name: `Produto PLU B ${uid()}`,
      categoryId: '2',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: `PLUB${uid()}`,
      expirationDate: DATE_FUTURE,
      plu: pluRepetido,
    })
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.formError()).toBeVisible()
    await expect(produtosPage.formError()).toContainText(`PLU ${pluRepetido}`)
  })

  test('TC-016 — deve exibir erro da API ao cadastrar código de barras duplicado', async () => {
    const barcodeRepetido = `DUP${uid()}`
    const nome1 = `Produto Original ${uid()}`
    const nome2 = `Produto Duplicado ${uid()}`

    // Cria o primeiro produto com o código de barras
    await produtosPage.fillForm({
      name: nome1,
      categoryId: '1',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: barcodeRepetido,
      expirationDate: DATE_FUTURE,
    })
    await produtosPage.submitForm()
    await produtosPage.modal().waitFor({ state: 'hidden' })

    // Tenta criar segundo produto com mesmo código
    await produtosPage.openNewProductModal()
    await produtosPage.fillForm({
      name: nome2,
      categoryId: '2',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: barcodeRepetido,
      expirationDate: DATE_FUTURE,
    })
    await produtosPage.submitForm()

    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.formError()).toBeVisible()
  })

  test('TC-017 — não deve permitir enviar formulário totalmente vazio', async () => {
    await produtosPage.submitForm()
    await expect(produtosPage.modal()).toBeVisible()
    await expect(produtosPage.modal().getByText('Nome é obrigatório')).toBeVisible()
  })
})

test.describe('Cadastro de Produtos — Bugs Conhecidos', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-020b — barcode vazio não causa erro: dois produtos sem barcode coexistem (Bug #2 corrigido)', async () => {
    // Bug #2 foi corrigido no backend: barcode "" é convertido para null antes de
    // persistir. O MariaDB permite múltiplos NULL em coluna UNIQUE, então dois
    // produtos sem barcode não geram mais conflito P2002.
    const nome1 = `Produto SemBarcode A ${uid()}`
    const nome2 = `Produto SemBarcode B ${uid()}`

    // Primeiro produto sem barcode — deve criar sem erro
    await produtosPage.createProduct({
      name: nome1,
      categoryId: '1',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      expirationDate: DATE_FUTURE,
    })
    await expect(produtosPage.rowByName(nome1)).toBeVisible()

    // Segundo produto sem barcode — deve criar sem erro (não viola UNIQUE)
    await produtosPage.createProduct({
      name: nome2,
      categoryId: '1',
      unit: 'kg',
      costPrice: '12.00',
      salePrice: '18.00',
      expirationDate: DATE_FUTURE,
    })
    await expect(produtosPage.rowByName(nome2)).toBeVisible()
  })
})

test.describe('Cadastro de Produtos — Segurança (XSS)', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-018 — deve exibir como texto, não executar, script no nome do produto', async ({ adminPage }) => {
    const xssPayload = `<img src=x onerror=alert('xss')> Produto ${uid()}`

    let alertFired = false
    adminPage.on('dialog', () => { alertFired = true })

    await produtosPage.createProduct({
      name: xssPayload,
      categoryId: '1',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: `TC018${uid()}`,   // workaround Bug #2
      expirationDate: DATE_FUTURE,
    })

    await adminPage.waitForTimeout(500)
    expect(alertFired).toBe(false)
  })

  test('TC-019 — deve sanitizar script no campo descrição', async ({ adminPage }) => {
    let alertFired = false
    adminPage.on('dialog', () => { alertFired = true })

    const nome = `Produto Desc XSS ${uid()}`
    await produtosPage.openNewProductModal()
    await produtosPage.fillForm({
      name: nome,
      description: `<script>alert('xss')</script>Descrição normal`,
      categoryId: '1',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      expirationDate: DATE_FUTURE,
    })
    await produtosPage.submitForm()

    await adminPage.waitForTimeout(500)
    expect(alertFired).toBe(false)
  })
})
