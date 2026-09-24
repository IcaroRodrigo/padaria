/**
 * Testes E2E — Módulo: Listagem, Busca e Exportação de Produtos
 *
 * Cobertura:
 *   - Listagem: tabela com produtos, colunas, estado vazio
 *   - Busca: por nome, por código de barras, sem resultado
 *   - Filtro: por categoria
 *   - Exportação: geração do arquivo ITENSMGV.txt (balança Toledo)
 *   - Autorização: operador caixa não acessa /produtos
 */

import { test, expect } from '../../fixtures/auth.fixture'
import { ProdutosPage } from '../../pages/ProdutosPage'

const uid = () => Date.now().toString().slice(-6)
const DATE_FUTURE = '2027-12-31'

test.describe('Listagem de Produtos', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-039 — página de produtos carrega com heading correto', async ({ adminPage }) => {
    await expect(adminPage.getByRole('heading', { name: 'Produtos' })).toBeVisible()
  })

  test('TC-040 — tabela exibe colunas esperadas', async ({ adminPage }) => {
    await expect(adminPage.getByRole('columnheader', { name: 'Produto' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Categoria' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Unid.' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'PLU' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Custo' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Venda' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Margem' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Validade' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Status' })).toBeVisible()
  })

  test('TC-041 — botões "Novo Produto" e "Exportar Balança" estão visíveis', async () => {
    await expect(produtosPage.btnNovoProduto()).toBeVisible()
    await expect(produtosPage.btnExportarBalanca()).toBeVisible()
  })
})

test.describe('Busca de Produtos', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-042 — deve filtrar produtos pelo nome via campo de busca', async () => {
    const nomeProduto = `Chá de Camomila Busca ${uid()}`

    await produtosPage.createProduct({
      name: nomeProduto,
      categoryId: '1',
      unit: 'kg',
      costPrice: '30.00',
      salePrice: '49.90',
      barcode: `TC042${uid()}`,   // workaround Bug #2
      expirationDate: DATE_FUTURE,
    })

    await produtosPage.searchInput().fill('Camomila Busca')
    await produtosPage.rowByName(nomeProduto).waitFor({ state: 'visible' })
    await expect(produtosPage.rowByName(nomeProduto)).toBeVisible()
  })

  test('TC-043 — deve filtrar produto pelo código de barras', async () => {
    const codBarras = `SEARCH${uid()}`
    const nome = `Produto Busca Barcode ${uid()}`

    await produtosPage.createProduct({
      name: nome,
      categoryId: '2',
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: codBarras,
      expirationDate: DATE_FUTURE,
    })

    await produtosPage.searchInput().fill(codBarras)
    await produtosPage.rowByName(nome).waitFor({ state: 'visible' })
    await expect(produtosPage.rowByName(nome)).toBeVisible()
  })

  test('TC-044 — busca por termo inexistente exibe estado vazio', async () => {
    await produtosPage.searchInput().fill('xyzprodutoinexistente999')
    await produtosPage.emptyState().waitFor({ state: 'visible' })
    await expect(produtosPage.emptyState()).toBeVisible()
  })

  test('TC-045 — limpar busca restaura lista completa', async () => {
    await produtosPage.searchInput().fill('xyzprodutoinexistente999')
    await produtosPage.emptyState().waitFor({ state: 'visible' })

    await produtosPage.searchInput().clear()

    await expect(produtosPage.emptyState()).toBeHidden()
    const rows = produtosPage.tableRows()
    await expect(rows).not.toHaveCount(0)
  })
})

test.describe('Filtro por Categoria', () => {
  let produtosPage: ProdutosPage

  test.beforeEach(async ({ adminPage }) => {
    produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()
  })

  test('TC-046 — filtro de categoria exibe apenas produtos da categoria selecionada', async () => {
    const nomeCha = `Chá Filtro ${uid()}`
    await produtosPage.createProduct({
      name: nomeCha,
      categoryId: '1',   // Chás e Ervas
      unit: 'kg',
      costPrice: '20.00',
      salePrice: '35.00',
      barcode: `TC046A${uid()}`,   // workaround Bug #2
      expirationDate: DATE_FUTURE,
    })

    const nomeGrao = `Grão Filtro ${uid()}`
    await produtosPage.createProduct({
      name: nomeGrao,
      categoryId: '2',   // Grãos e Cereais
      unit: 'kg',
      costPrice: '10.00',
      salePrice: '16.00',
      barcode: `TC046B${uid()}`,   // workaround Bug #2
      expirationDate: DATE_FUTURE,
    })

    // Filtra por categoria ID 1 (Chás e Ervas)
    await produtosPage.categoryFilter().selectOption({ value: '1' })

    await expect(produtosPage.rowByName(nomeCha)).toBeVisible()
    await expect(produtosPage.rowByName(nomeGrao)).toBeHidden()
  })

  test('TC-047 — "Todas as categorias" restaura listagem completa', async () => {
    await produtosPage.categoryFilter().selectOption({ value: '1' })
    // Seleciona o placeholder (valor vazio = todas as categorias)
    await produtosPage.categoryFilter().selectOption({ value: '' })

    const rows = produtosPage.tableRows()
    await expect(rows).not.toHaveCount(0)
  })
})

test.describe('Exportação para Balança Toledo', () => {
  test('TC-048 — botão "Exportar Balança" dispara download do ITENSMGV.txt', async ({ adminPage }) => {
    const produtosPage = new ProdutosPage(adminPage)
    await produtosPage.goto()

    const [download] = await Promise.all([
      adminPage.waitForEvent('download'),
      produtosPage.btnExportarBalanca().click(),
    ])

    expect(download.suggestedFilename()).toBe('ITENSMGV.txt')
  })
})

test.describe('Autorização — Perfil Caixa', () => {
  test('TC-049 — [BUG #3] usuário caixa acessa /produtos sem ser redirecionado', async ({ caixaPage }) => {
    // BUG #3 (Security / Major): a rota /produtos não restringe o perfil CAIXA.
    // O usuário caixa consegue visualizar e acessar a gestão de produtos, incluindo
    // os botões "Novo Produto" e "Exportar Balança", que deveriam ser exclusivos do ADMIN.
    // Fix sugerido: adicionar verificação de role no middleware/guard da rota /produtos
    // ou no componente de layout para redirecionar CAIXA para /pdv.
    await caixaPage.goto('/produtos')

    // OBTIDO (bug): caixa permanece em /produtos sem redirecionamento
    await expect(caixaPage).toHaveURL(/\/produtos/)
  })
})
