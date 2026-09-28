import { Page, Locator } from '@playwright/test'

export class PdvPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/pdv')
  }

  // ── Estado: sem caixa aberto ───────────────────────────────────────────────

  openCashRegisterHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Abrir Caixa' })
  }

  fieldOpeningBalance(): Locator {
    return this.page.getByPlaceholder('0,00')
  }

  btnAbrirCaixa(): Locator {
    return this.page.getByRole('button', { name: 'Abrir Caixa' })
  }

  // ── Estado: caixa aberto ───────────────────────────────────────────────────

  searchInput(): Locator {
    return this.page.getByPlaceholder('Buscar produto por nome ou código de barras...')
  }

  cashRegisterInfo(): Locator {
    return this.page.locator('text=/Caixa #\\d+ aberto/')
  }

  btnFecharCaixa(): Locator {
    return this.page.getByText('Fechar caixa').first()
  }

  btnCliente(): Locator {
    return this.page.getByText('Cliente').first()
  }

  // ── Dropdown de busca de produtos ─────────────────────────────────────────

  searchDropdown(): Locator {
    return this.page.locator('div.absolute.top-full')
  }

  searchResultByName(name: string): Locator {
    return this.searchDropdown().getByText(name)
  }

  // ── Carrinho ──────────────────────────────────────────────────────────────

  cartEmpty(): Locator {
    return this.page.getByText('Carrinho vazio')
  }

  cartItemByName(name: string): Locator {
    return this.page.locator('div.bg-white.rounded-xl.border').filter({ hasText: name })
  }

  // ── Painel de pagamento ───────────────────────────────────────────────────

  paymentMethodBtn(method: 'Dinheiro' | 'PIX' | 'Débito' | 'Crédito'): Locator {
    return this.page.getByRole('button', { name: method })
  }

  btnFinalizar(): Locator {
    return this.page.getByRole('button', { name: /Finalizar Venda|Gerar QR Code PIX/ })
  }

  fieldAmountReceived(): Locator {
    // div.mt-3 que contém a label "Valor recebido" — só aparece quando CASH está selecionado
    return this.page.locator('div.mt-3').filter({ hasText: 'Valor recebido' }).locator('input[type="number"]')
  }

  saleSuccess(): Locator {
    return this.page.getByText('Venda concluída!')
  }

  btnNovaVenda(): Locator {
    return this.page.getByRole('button', { name: 'Nova Venda' })
  }

  // ── Modal de fechamento de caixa ──────────────────────────────────────────

  closeCashRegisterModal(): Locator {
    return this.page.locator('div.fixed.inset-0.z-50')
  }

  fieldClosingBalance(): Locator {
    return this.closeCashRegisterModal().locator('input[type="number"]')
  }

  btnFecharCaixaModal(): Locator {
    return this.closeCashRegisterModal().getByRole('button', { name: 'Fechar caixa' })
  }

  btnConfirmarFechamento(): Locator {
    return this.closeCashRegisterModal().getByRole('button', { name: 'Confirmar fechamento' })
  }

  // Botão "Concluir" que aparece no modal de sucesso após o caixa ser fechado
  btnConcluirFechamento(): Locator {
    return this.closeCashRegisterModal().getByRole('button', { name: 'Concluir' })
  }

  // ── Modal de seleção de cliente ───────────────────────────────────────────

  customerSearchModal(): Locator {
    return this.page.locator('div.fixed.inset-0.z-50')
  }

  customerSearchInput(): Locator {
    return this.customerSearchModal().getByPlaceholder('Buscar por nome, CPF ou telefone...')
  }

  customerResultByName(name: string): Locator {
    return this.customerSearchModal().getByRole('button', { name })
  }

  customerEmptyState(): Locator {
    return this.customerSearchModal().getByText('Nenhum cliente encontrado')
  }

  // ── Helpers de alto nível ──────────────────────────────────────────────────

  /** Aguarda a página do PDV atingir estado estável (caixa aberto ou fechado) */
  private async waitForPdvStableState(timeout = 8000) {
    await Promise.race([
      this.searchInput().waitFor({ state: 'visible', timeout }),
      this.openCashRegisterHeading().waitFor({ state: 'visible', timeout }),
    ]).catch(() => {})
  }

  /** Garante que existe um caixa aberto antes do teste */
  async ensureCashRegisterOpen(openingBalance = '100') {
    await this.goto()
    await this.waitForPdvStableState()
    const heading = this.openCashRegisterHeading()
    const isHeadingVisible = await heading.isVisible().catch(() => false)
    if (isHeadingVisible) {
      await this.fieldOpeningBalance().fill(openingBalance)
      await this.btnAbrirCaixa().click()
      await this.searchInput().waitFor({ state: 'visible' })
    }
  }

  /** Fecha o caixa se estiver aberto (via UI) */
  async closeCashRegisterIfOpen() {
    await this.goto()
    await this.waitForPdvStableState()
    const fecharBtn = this.btnFecharCaixa()
    const isVisible = await fecharBtn.isVisible().catch(() => false)
    if (!isVisible) return

    await fecharBtn.click()
    await this.closeCashRegisterModal().waitFor({ state: 'visible' })
    await this.fieldClosingBalance().fill('100')
    await this.btnFecharCaixaModal().click()
    await this.btnConfirmarFechamento().waitFor({ state: 'visible' })
    await this.btnConfirmarFechamento().click()
    // Modal de sucesso "Caixa fechado!" — clicar em Concluir para fechar
    await this.btnConcluirFechamento().waitFor({ state: 'visible' })
    await this.btnConcluirFechamento().click()
    await this.openCashRegisterHeading().waitFor({ state: 'visible' })
  }

  async addProductBySearch(productName: string) {
    await this.searchInput().fill(productName.substring(0, 4))
    await this.searchDropdown().waitFor({ state: 'visible' })
    await this.searchResultByName(productName).first().click()
  }
}
