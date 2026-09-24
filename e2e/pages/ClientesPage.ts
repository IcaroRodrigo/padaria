import { Page, Locator } from '@playwright/test'

export interface CustomerFormData {
  name: string
  cpf?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export class ClientesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/clientes')
  }

  // ── Botões principais ─────────────────────────────────────────────────────

  btnNovoCliente(): Locator {
    return this.page.getByRole('button', { name: /Novo Cliente/ })
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  searchInput(): Locator {
    return this.page.getByPlaceholder('Buscar por nome, CPF ou telefone...')
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  modal(): Locator {
    return this.page.locator('div.fixed.inset-0.z-50')
  }

  modalTitle(): Locator {
    return this.modal().locator('h2')
  }

  // ── Campos do formulário (escopados ao modal) ──────────────────────────────

  fieldName(): Locator {
    return this.modal().locator('input[name="name"]')
  }

  fieldCpf(): Locator {
    return this.modal().getByPlaceholder('000.000.000-00')
  }

  fieldPhone(): Locator {
    return this.modal().getByPlaceholder('(00) 00000-0000')
  }

  fieldEmail(): Locator {
    return this.modal().locator('input[name="email"]')
  }

  fieldAddress(): Locator {
    return this.modal().locator('input[name="address"]')
  }

  fieldNotes(): Locator {
    return this.modal().locator('textarea[name="notes"]')
  }

  submitButton(): Locator {
    return this.modal().getByRole('button', { name: /Cadastrar cliente|Salvar alterações/ })
  }

  formError(): Locator {
    return this.modal().locator('p.text-destructive')
  }

  fieldNameError(): Locator {
    return this.modal().getByText('Nome é obrigatório')
  }

  fieldEmailError(): Locator {
    return this.modal().getByText('E-mail inválido')
  }

  // ── Tabela ────────────────────────────────────────────────────────────────

  tableRows(): Locator {
    return this.page.locator('tbody tr')
  }

  rowByName(name: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: name })
  }

  editButtonForRow(name: string): Locator {
    return this.rowByName(name).getByTitle('Editar')
  }

  viewButtonForRow(name: string): Locator {
    return this.rowByName(name).getByTitle('Ver histórico')
  }

  emptyState(): Locator {
    return this.page.getByText('Nenhum cliente encontrado')
  }

  // ── Helpers de alto nível ──────────────────────────────────────────────────

  async openNewCustomerModal() {
    await this.btnNovoCliente().click()
    await this.modal().waitFor({ state: 'visible' })
  }

  async openEditModal(customerName: string) {
    await this.editButtonForRow(customerName).click()
    await this.modal().waitFor({ state: 'visible' })
  }

  async openDetailModal(customerName: string) {
    await this.viewButtonForRow(customerName).click()
    await this.modal().waitFor({ state: 'visible' })
  }

  async fillForm(data: CustomerFormData) {
    if (data.name !== undefined) await this.fieldName().fill(data.name)
    if (data.cpf !== undefined) await this.fieldCpf().fill(data.cpf)
    if (data.phone !== undefined) await this.fieldPhone().fill(data.phone)
    if (data.email !== undefined) await this.fieldEmail().fill(data.email)
    if (data.address !== undefined) await this.fieldAddress().fill(data.address)
    if (data.notes !== undefined) await this.fieldNotes().fill(data.notes)
  }

  async submitForm() {
    await this.submitButton().click()
  }

  async createCustomer(data: CustomerFormData) {
    await this.openNewCustomerModal()
    await this.fillForm(data)
    await this.submitForm()
    await this.modal().waitFor({ state: 'hidden' })
  }
}
