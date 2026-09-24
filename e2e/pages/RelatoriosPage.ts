import { Page, Locator } from '@playwright/test'

export class RelatoriosPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/relatorios')
  }

  heading(): Locator {
    return this.page.getByRole('heading', { name: 'Relatórios' })
  }

  // ── Abas ──────────────────────────────────────────────────────────────────

  tabVendas(): Locator {
    return this.page.getByRole('button', { name: 'Vendas' })
  }

  tabAuditoria(): Locator {
    return this.page.getByRole('button', { name: 'Auditoria de Caixa' })
  }

  // ── Controles de período ──────────────────────────────────────────────────

  inputDe(): Locator {
    return this.page.locator('input[type="date"]').nth(0)
  }

  inputAte(): Locator {
    return this.page.locator('input[type="date"]').nth(1)
  }

  btnPorDia(): Locator {
    return this.page.getByRole('button', { name: 'Por dia' })
  }

  btnPorMes(): Locator {
    return this.page.getByRole('button', { name: 'Por mês' })
  }

  // ── Cards de resumo (aba Vendas) ──────────────────────────────────────────

  cardReceita(): Locator {
    return this.page.locator('text=Receita (vendas)')
  }

  cardDespesasFixas(): Locator {
    return this.page.locator('text=Despesas fixas')
  }

  cardDespesasVariaveis(): Locator {
    return this.page.locator('text=Despesas variáveis')
  }

  cardResultado(): Locator {
    return this.page.locator('text=Resultado')
  }

  // ── Tabela de auditoria ───────────────────────────────────────────────────

  tableRows(): Locator {
    return this.page.locator('tbody tr')
  }

  emptyAuditoria(): Locator {
    return this.page.getByText('Nenhum caixa encontrado no período')
  }

  // ── Cards de resumo (aba Auditoria) ──────────────────────────────────────

  cardCaixasPeriodo(): Locator {
    return this.page.locator('text=Caixas no período')
  }

  cardCaixasAberto(): Locator {
    return this.page.locator('text=Caixas em aberto')
  }

  cardDiferencaAcumulada(): Locator {
    return this.page.locator('text=Diferença acumulada')
  }
}
