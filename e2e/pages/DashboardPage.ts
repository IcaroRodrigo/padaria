import { Page, Locator } from '@playwright/test'

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard')
  }

  heading(): Locator {
    return this.page.getByRole('heading', { name: 'Dashboard' })
  }

  // ── Cards de estatísticas ─────────────────────────────────────────────────

  cardFaturamentoHoje(): Locator {
    return this.page.locator('text=Faturamento Hoje')
  }

  cardTicketMedio(): Locator {
    return this.page.locator('text=Ticket Médio')
  }

  cardFaturamentoSemana(): Locator {
    return this.page.locator('text=Faturamento Semana')
  }

  cardFaturamentoMes(): Locator {
    return this.page.locator('text=Faturamento Mês')
  }

  // ── Seções ────────────────────────────────────────────────────────────────

  chartFaturamento(): Locator {
    return this.page.locator('text=Faturamento do Mês (por dia)')
  }

  topProdutos(): Locator {
    return this.page.locator('text=Top 5 Produtos (mês)')
  }
}
