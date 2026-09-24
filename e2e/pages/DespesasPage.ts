import { Page, Locator } from '@playwright/test'

export interface ExpenseFormData {
  description: string
  amount: string
  categoryId?: string  // valor do select (ID como string)
  type?: 'FIXED' | 'VARIABLE'
  status?: 'PENDING' | 'PAID'
  dueDate?: string     // YYYY-MM-DD
  notes?: string
}

export class DespesasPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/despesas')
  }

  // ── Botões principais ─────────────────────────────────────────────────────

  btnNovaDespesa(): Locator {
    return this.page.getByRole('button', { name: /Nova Despesa/ })
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  statusFilter(): Locator {
    return this.page.locator('select').nth(0)
  }

  typeFilter(): Locator {
    return this.page.locator('select').nth(1)
  }

  // ── Cards de resumo ───────────────────────────────────────────────────────

  cardAPagar(): Locator {
    return this.page.locator('text=A pagar').first()
  }

  cardPago(): Locator {
    return this.page.locator('text=Pago').first()
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  modal(): Locator {
    return this.page.locator('div.fixed.inset-0.z-50')
  }

  modalTitle(): Locator {
    return this.modal().locator('h2')
  }

  // ── Campos do formulário (escopados ao modal) ──────────────────────────────

  fieldDescription(): Locator {
    return this.modal().getByPlaceholder('Ex: Aluguel de dezembro')
  }

  fieldAmount(): Locator {
    return this.modal().locator('input[name="amount"]')
  }

  fieldCategory(): Locator {
    return this.modal().locator('select[name="categoryId"]')
  }

  fieldType(): Locator {
    return this.modal().locator('select[name="type"]')
  }

  fieldStatus(): Locator {
    return this.modal().locator('select[name="status"]')
  }

  fieldDueDate(): Locator {
    return this.modal().locator('input[name="dueDate"]')
  }

  fieldNotes(): Locator {
    return this.modal().locator('textarea[name="notes"]')
  }

  submitButton(): Locator {
    return this.modal().getByRole('button', { name: /Registrar despesa|Salvar alterações/ })
  }

  formError(): Locator {
    return this.modal().locator('p.text-destructive')
  }

  descriptionError(): Locator {
    return this.modal().getByText('Descrição é obrigatória')
  }

  amountError(): Locator {
    return this.modal().getByText('Valor inválido')
  }

  categoryError(): Locator {
    return this.modal().getByText('Categoria é obrigatória')
  }

  // ── Tabela ────────────────────────────────────────────────────────────────

  tableRows(): Locator {
    return this.page.locator('tbody tr')
  }

  rowByDescription(desc: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: desc })
  }

  editButtonForRow(desc: string): Locator {
    return this.rowByDescription(desc).getByTitle('Editar')
  }

  payButtonForRow(desc: string): Locator {
    return this.rowByDescription(desc).getByTitle('Marcar como pago')
  }

  duplicateButtonForRow(desc: string): Locator {
    return this.rowByDescription(desc).getByTitle('Duplicar para próximo mês')
  }

  emptyState(): Locator {
    return this.page.getByText('Nenhuma despesa encontrada')
  }

  // ── Helpers de alto nível ──────────────────────────────────────────────────

  async openNewExpenseModal() {
    await this.btnNovaDespesa().click()
    await this.modal().waitFor({ state: 'visible' })
  }

  async openEditModal(desc: string) {
    await this.editButtonForRow(desc).click()
    await this.modal().waitFor({ state: 'visible' })
  }

  async fillForm(data: ExpenseFormData) {
    if (data.description !== undefined) await this.fieldDescription().fill(data.description)
    if (data.amount !== undefined) await this.fieldAmount().fill(data.amount)
    if (data.categoryId !== undefined) await this.fieldCategory().selectOption({ value: data.categoryId })
    if (data.type !== undefined) await this.fieldType().selectOption({ value: data.type })
    if (data.status !== undefined) await this.fieldStatus().selectOption({ value: data.status })
    if (data.dueDate !== undefined) await this.fieldDueDate().fill(data.dueDate)
    if (data.notes !== undefined) await this.fieldNotes().fill(data.notes)
  }

  async submitForm() {
    await this.submitButton().click()
  }

  async createExpense(data: ExpenseFormData) {
    await this.openNewExpenseModal()
    await this.fillForm(data)
    await this.submitForm()
    await this.modal().waitFor({ state: 'hidden' })
  }
}
