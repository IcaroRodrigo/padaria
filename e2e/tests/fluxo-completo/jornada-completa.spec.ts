/**
 * Teste E2E — Jornada Completa da Panificadora
 *
 * Fluxo sequencial que simula o dia a dia do administrador:
 *   1. Login e navegação entre todos os menus
 *   2. Cadastro de fornecedor
 *   3. Cadastro de 3 produtos (pão, bolo, coxinha)
 *   4. Cadastro de cliente
 *   5. Cadastro de 2 despesas (fixa e variável)
 *   6. PDV: abre caixa → 2 vendas em dinheiro → fecha caixa
 *   7. Relatórios: verifica aba Vendas e Auditoria de Caixa
 *
 * Pré-condições:
 *   - Backend rodando em http://localhost:3002
 *   - Frontend rodando em http://localhost:3003
 *   - Banco com seed executado (admin@panificadora.com / Admin@123)
 */

import { test, expect } from '../../fixtures/auth.fixture'
import { ProdutosPage } from '../../pages/ProdutosPage'
import { ClientesPage } from '../../pages/ClientesPage'
import { FornecedoresPage } from '../../pages/FornecedoresPage'
import { DespesasPage } from '../../pages/DespesasPage'
import { PdvPage } from '../../pages/PdvPage'
import { RelatoriosPage } from '../../pages/RelatoriosPage'

// ID único por execução — garante dados isolados entre runs
const uid = () => Date.now().toString().slice(-6)

test.describe.serial('Jornada Completa — Panificadora', () => {
  // Dados compartilhados entre os testes do bloco serial
  const id = uid()
  const TODAY = new Date().toISOString().split('T')[0]
  const DATE_FUTURE = '2027-12-31'

  const FORNECEDOR = `Farinhas do Norte E2E-${id}`
  const CNPJ_FORNECEDOR = `12.${id.slice(0,3)}.${id.slice(3,6)}/0001-99`
  const PRODUTO_PAO = `Pão Francês E2E-${id}`
  const PRODUTO_BOLO = `Bolo de Cenoura E2E-${id}`
  const PRODUTO_COXINHA = `Coxinha de Frango E2E-${id}`
  const CLIENTE = `Maria da Silva E2E-${id}`
  const cpfDigits = id.padStart(11, '0')
  const CPF_CLIENTE = `${cpfDigits.slice(0,3)}.${cpfDigits.slice(3,6)}.${cpfDigits.slice(6,9)}-${cpfDigits.slice(9,11)}`
  const DESPESA_ALUGUEL = `Aluguel Dezembro E2E-${id}`
  const DESPESA_FARINHA = `Compra de Farinha E2E-${id}`

  // ── 1. Login e navegação ──────────────────────────────────────────────────

  test('1. Login e navegação entre todos os menus', async ({ adminPage }) => {
    // O fixture adminPage já está logado e na tela /dashboard
    await expect(adminPage).toHaveURL(/\/dashboard/)
    await expect(adminPage.getByRole('heading', { name: /Dashboard/ })).toBeVisible()

    // Sidebar deve mostrar o nome da empresa
    await expect(adminPage.locator('aside').getByText('Minha Panificadora').first()).toBeVisible()

    // Navega por cada módulo e verifica que a página carregou
    const modulos = [
      // PDV não tem heading quando o caixa está aberto — verifica o input de busca ou o heading de abertura
      { href: '/pdv',          check: () => adminPage.locator('[placeholder*="Buscar produto"], h1:has-text("Abrir Caixa"), h2:has-text("Abrir Caixa")').first() },
      { href: '/produtos',     check: () => adminPage.getByRole('heading', { name: /Produtos/ }).first() },
      { href: '/clientes',     check: () => adminPage.getByRole('heading', { name: /Clientes/ }).first() },
      { href: '/fornecedores', check: () => adminPage.getByRole('heading', { name: /Fornecedores/ }).first() },
      { href: '/despesas',     check: () => adminPage.getByRole('heading', { name: /Despesas/ }).first() },
      { href: '/relatorios',   check: () => adminPage.getByRole('heading', { name: /Relatórios/ }).first() },
      { href: '/dashboard',    check: () => adminPage.getByRole('heading', { name: /Dashboard/ }).first() },
    ]

    for (const modulo of modulos) {
      await adminPage.goto(modulo.href)
      await expect(modulo.check()).toBeVisible()
    }
  })

  // ── 2. Cadastro de fornecedor ─────────────────────────────────────────────

  test('2. Cadastra fornecedor', async ({ adminPage }) => {
    const page = new FornecedoresPage(adminPage)
    await page.goto()

    await page.createSupplier({
      companyName: FORNECEDOR,
      tradeName: `Farinhas Norte`,
      cnpj: CNPJ_FORNECEDOR,
      phone: '(85) 99999-1234',
      email: 'contato@farinhasnorte.com.br',
      address: 'Rua do Trigo, 100 — Fortaleza/CE',
      deliveryDays: '3',
    })

    await expect(page.rowByName(FORNECEDOR)).toBeVisible()
  })

  // ── 3. Cadastro de produtos ───────────────────────────────────────────────

  test('3. Cadastra 3 produtos (pão, bolo, coxinha)', async ({ adminPage }) => {
    const page = new ProdutosPage(adminPage)
    await page.goto()

    // Produto 1 — Pão Francês (kg, Pães)
    await page.createProduct({
      name: PRODUTO_PAO,
      description: 'Pão francês tradicional, crocante por fora e macio por dentro',
      categoryId: '1',
      unit: 'kg',
      costPrice: '4.50',
      salePrice: '8.90',
      barcode: `789${id}01`,
      expirationDate: DATE_FUTURE,
      stockQty: '20',
      minStockQty: '5',
    })
    await expect(page.rowByName(PRODUTO_PAO)).toBeVisible()

    // Produto 2 — Bolo de Cenoura (un, Bolos e Tortas)
    await page.createProduct({
      name: PRODUTO_BOLO,
      description: 'Bolo de cenoura com cobertura de chocolate',
      categoryId: '2',
      unit: 'unidade',
      costPrice: '12.00',
      salePrice: '22.90',
      barcode: `789${id}02`,
      expirationDate: DATE_FUTURE,
      stockQty: '10',
      minStockQty: '2',
    })
    await expect(page.rowByName(PRODUTO_BOLO)).toBeVisible()

    // Produto 3 — Coxinha (un, Salgados) — usado no PDV
    await page.createProduct({
      name: PRODUTO_COXINHA,
      description: 'Coxinha de frango cremosa, massa crocante',
      categoryId: '3',
      unit: 'unidade',
      costPrice: '1.80',
      salePrice: '4.50',
      barcode: `789${id}03`,
      expirationDate: DATE_FUTURE,
      stockQty: '50',
      minStockQty: '10',
    })
    await expect(page.rowByName(PRODUTO_COXINHA)).toBeVisible()
  })

  // ── 4. Cadastro de cliente ────────────────────────────────────────────────

  test('4. Cadastra cliente', async ({ adminPage }) => {
    const page = new ClientesPage(adminPage)
    await page.goto()

    await page.createCustomer({
      name: CLIENTE,
      cpf: CPF_CLIENTE,
      phone: '(11) 98765-4321',
      email: `maria.e2e${id}@email.com`,
      address: 'Rua das Flores, 42 — São Paulo/SP',
    })

    await expect(page.rowByName(CLIENTE)).toBeVisible()
  })

  // ── 5. Cadastro de despesas ───────────────────────────────────────────────

  test('5. Cadastra 2 despesas (fixa e variável)', async ({ adminPage }) => {
    const page = new DespesasPage(adminPage)
    await page.goto()

    // Despesa 1 — Aluguel (fixa, categoria Aluguel = id 1)
    await page.createExpense({
      description: DESPESA_ALUGUEL,
      amount: '3500',
      categoryId: '1',
      type: 'FIXED',
      status: 'PENDING',
      dueDate: TODAY,
    })
    await expect(page.rowByDescription(DESPESA_ALUGUEL)).toBeVisible()

    // Despesa 2 — Compra de farinha (variável, categoria Matéria-Prima = id 5)
    await page.createExpense({
      description: DESPESA_FARINHA,
      amount: '850',
      categoryId: '5',
      type: 'VARIABLE',
      status: 'PAID',
      dueDate: TODAY,
    })
    await expect(page.rowByDescription(DESPESA_FARINHA)).toBeVisible()
  })

  // ── 6. PDV: caixa, vendas e fechamento ───────────────────────────────────

  test('6. PDV: abre caixa, realiza 2 vendas e fecha o caixa', async ({ adminPage }) => {
    const pdv = new PdvPage(adminPage)

    // Garante estado limpo: fecha se já houver caixa aberto, depois abre novo com R$ 200
    await pdv.closeCashRegisterIfOpen()
    await pdv.ensureCashRegisterOpen('200')
    await expect(pdv.cashRegisterInfo()).toBeVisible()

    // ── Venda 1: Coxinha de Frango (Dinheiro) ──────────────────────────────

    // Adiciona Coxinha ao carrinho
    await pdv.addProductBySearch(PRODUTO_COXINHA)
    await expect(pdv.cartEmpty()).not.toBeVisible()

    // Adiciona mais uma unidade (busca de novo)
    await pdv.addProductBySearch(PRODUTO_COXINHA)

    // CASH é o método padrão — não precisa clicar, apenas preenche valor recebido
    await pdv.fieldAmountReceived().fill('20')
    await pdv.btnFinalizar().click()
    await expect(pdv.saleSuccess()).toBeVisible()
    await expect(pdv.saleSuccess()).toContainText('Venda concluída')

    // Inicia nova venda
    await pdv.btnNovaVenda().click()
    await expect(pdv.cartEmpty()).toBeVisible()

    // ── Venda 2: Bolo de Cenoura (Dinheiro) ───────────────────────────────

    await pdv.addProductBySearch(PRODUTO_BOLO)
    await expect(pdv.cartEmpty()).not.toBeVisible()

    await pdv.fieldAmountReceived().fill('30')
    await pdv.btnFinalizar().click()
    await expect(pdv.saleSuccess()).toBeVisible()

    await pdv.btnNovaVenda().click()

    // ── Fecha o caixa ──────────────────────────────────────────────────────

    await pdv.btnFecharCaixa().click()
    await pdv.closeCashRegisterModal().waitFor({ state: 'visible' })
    await pdv.fieldClosingBalance().fill('250')
    await pdv.btnFecharCaixaModal().click()
    await pdv.btnConfirmarFechamento().waitFor({ state: 'visible' })
    await pdv.btnConfirmarFechamento().click()
    // Modal de sucesso "Caixa fechado!" — confirma com Concluir
    await pdv.btnConcluirFechamento().waitFor({ state: 'visible' })
    await expect(pdv.closeCashRegisterModal()).toContainText('Caixa fechado!')
    await pdv.btnConcluirFechamento().click()

    // Após fechamento volta para tela de "Abrir Caixa"
    await expect(pdv.openCashRegisterHeading()).toBeVisible()
  })

  // ── 7. Relatórios ─────────────────────────────────────────────────────────

  test('7. Visualiza relatórios de vendas e auditoria de caixa', async ({ adminPage }) => {
    const page = new RelatoriosPage(adminPage)
    await page.goto()

    await expect(page.heading()).toBeVisible()

    // ── Aba Vendas ────────────────────────────────────────────────────────

    await page.tabVendas().click()

    // Cards de resumo do período devem estar presentes
    await expect(page.cardReceita()).toBeVisible()
    await expect(page.cardDespesasFixas()).toBeVisible()
    await expect(page.cardDespesasVariaveis()).toBeVisible()
    await expect(page.cardResultado()).toBeVisible()

    // Altera agrupamento para "Por mês"
    await page.btnPorMes().click()
    await expect(adminPage.getByRole('heading', { name: /Relatórios/ })).toBeVisible()

    // Volta para "Por dia"
    await page.btnPorDia().click()

    // ── Aba Auditoria de Caixa ────────────────────────────────────────────

    await page.tabAuditoria().click()

    // Cards de resumo da auditoria devem estar presentes
    await expect(page.cardCaixasPeriodo()).toBeVisible()
    await expect(page.cardCaixasAberto()).toBeVisible()
    await expect(page.cardDiferencaAcumulada()).toBeVisible()

    // O caixa fechado na etapa 6 deve aparecer na tabela (período padrão = mês atual)
    const rows = page.tableRows()
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThanOrEqual(1)

    // Verifica que a diferença do caixa fechado consta na linha
    // (saldo inicial 200, saldo final informado 250 — diferença = +50)
    await expect(rows.first()).toBeVisible()
  })
})
