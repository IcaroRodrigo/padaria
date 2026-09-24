/**
 * Testes E2E — Módulo: Relatórios
 *
 * Cobertura:
 *   - Estrutura: heading, abas, inputs de período, botões de agrupamento (TC-164 a TC-168)
 *   - Aba Vendas: cards Receita, Despesas fixas, Despesas variáveis, Resultado (TC-169 a TC-172)
 *   - Aba Auditoria: cards de resumo, tabela ou estado vazio (TC-173 a TC-175)
 */

import { test, expect } from '../../fixtures/auth.fixture'
import { RelatoriosPage } from '../../pages/RelatoriosPage'

// ──────────────────────────────────────────────────────────────────────────────
// Grupo 1 — Estrutura
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Relatórios — Estrutura', () => {
  let relatoriosPage: RelatoriosPage

  test.beforeEach(async ({ adminPage }) => {
    relatoriosPage = new RelatoriosPage(adminPage)
    await relatoriosPage.goto()
    await adminPage.waitForLoadState('networkidle')
  })

  test('TC-164 — heading "Relatórios" está visível', async ({ adminPage }) => {
    await expect(relatoriosPage.heading()).toBeVisible()
  })

  test('TC-165 — aba "Vendas" está visível e ativa por padrão', async ({ adminPage }) => {
    await expect(relatoriosPage.tabVendas()).toBeVisible()
    // A aba Vendas deve estar ativa por padrão — o card Receita deve estar visível sem clicar
    await expect(relatoriosPage.cardReceita()).toBeVisible()
  })

  test('TC-166 — aba "Auditoria de Caixa" está visível', async ({ adminPage }) => {
    await expect(relatoriosPage.tabAuditoria()).toBeVisible()
  })

  test('TC-167 — inputs de data "De:" e "Até:" estão visíveis', async ({ adminPage }) => {
    await expect(relatoriosPage.inputDe()).toBeVisible()
    await expect(relatoriosPage.inputAte()).toBeVisible()
  })

  test('TC-168 — botões "Por dia" e "Por mês" estão visíveis', async ({ adminPage }) => {
    await expect(relatoriosPage.btnPorDia()).toBeVisible()
    await expect(relatoriosPage.btnPorMes()).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Grupo 2 — Aba Vendas
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Relatórios — Aba Vendas', () => {
  let relatoriosPage: RelatoriosPage

  test.beforeEach(async ({ adminPage }) => {
    relatoriosPage = new RelatoriosPage(adminPage)
    await relatoriosPage.goto()
    // Garante que estamos na aba Vendas antes de cada teste
    await relatoriosPage.tabVendas().click()
    await adminPage.waitForLoadState('networkidle')
  })

  test('TC-169 — clicar em "Vendas" exibe card "Receita (vendas)"', async ({ adminPage }) => {
    await expect(relatoriosPage.cardReceita()).toBeVisible()
  })

  test('TC-170 — card "Despesas fixas" está visível', async ({ adminPage }) => {
    await expect(relatoriosPage.cardDespesasFixas()).toBeVisible()
  })

  test('TC-171 — card "Despesas variáveis" está visível', async ({ adminPage }) => {
    await expect(relatoriosPage.cardDespesasVariaveis()).toBeVisible()
  })

  test('TC-172 — card "Resultado" está visível', async ({ adminPage }) => {
    await expect(relatoriosPage.cardResultado()).toBeVisible()
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// Grupo 3 — Aba Auditoria
// ──────────────────────────────────────────────────────────────────────────────

test.describe('Relatórios — Aba Auditoria', () => {
  let relatoriosPage: RelatoriosPage

  test.beforeEach(async ({ adminPage }) => {
    relatoriosPage = new RelatoriosPage(adminPage)
    await relatoriosPage.goto()
    await relatoriosPage.tabAuditoria().click()
    await adminPage.waitForLoadState('networkidle')
  })

  test('TC-173 — clicar em "Auditoria de Caixa" exibe conteúdo da auditoria', async ({ adminPage }) => {
    // Após clicar na aba, pelo menos um dos cards de resumo deve aparecer
    await expect(
      relatoriosPage.cardCaixasPeriodo().or(relatoriosPage.emptyAuditoria())
    ).toBeVisible()
  })

  test('TC-174 — cards "Caixas no período", "Caixas em aberto" e "Diferença acumulada" estão visíveis', async ({ adminPage }) => {
    await expect(relatoriosPage.cardCaixasPeriodo()).toBeVisible()
    await expect(relatoriosPage.cardCaixasAberto()).toBeVisible()
    await expect(relatoriosPage.cardDiferencaAcumulada()).toBeVisible()
  })

  test('TC-175 — tabela de auditoria ou mensagem de estado vazio está visível', async ({ adminPage }) => {
    // O sistema pode ter caixas no período ou exibir a mensagem de estado vazio.
    // Qualquer uma das duas situações é válida e indica que a aba carregou corretamente.
    const hasRows = await relatoriosPage.tableRows().count().then(c => c > 0)

    if (hasRows) {
      await expect(relatoriosPage.tableRows().first()).toBeVisible()
    } else {
      await expect(relatoriosPage.emptyAuditoria()).toBeVisible()
    }
  })
})
