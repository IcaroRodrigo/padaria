import { Page, Locator } from '@playwright/test'

export interface SupplierFormData {
  companyName: string
  tradeName?: string
  cnpj?: string
  phone?: string
  email?: string
  address?: string
  deliveryDays?: string
  notes?: string
}

export class FornecedoresPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/fornecedores')
  }

  // ── Botões principais ─────────────────────────────────────────────────────

  btnNovoFornecedor(): Locator {
    return this.page.getByRole('button', { name: /Novo Fornecedor/ })
  }

  // ── Filtros ───────────────────────────────────────────────────────────────

  searchInput(): Locator {
    return this.page.getByPlaceholder('Buscar por nome, razão social ou CNPJ...')
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  modal(): Locator {
    return this.page.locator('div.fixed.inset-0.z-50')
  }

  modalTitle(): Locator {
    return this.modal().locator('h2')
  }

  // ── Campos do formulário (escopados ao modal) ──────────────────────────────

  fieldCompanyName(): Locator {
    return this.modal().locator('input[name="companyName"]')
  }

  fieldTradeName(): Locator {
    return this.modal().locator('input[name="tradeName"]')
  }

  fieldCnpj(): Locator {
    return this.modal().getByPlaceholder('00.000.000/0000-00')
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

  fieldDeliveryDays(): Locator {
    return this.modal().locator('input[name="deliveryDays"]')
  }

  fieldNotes(): Locator {
    return this.modal().locator('textarea[name="notes"]')
  }

  submitButton(): Locator {
    return this.modal().getByRole('button', { name: /Cadastrar fornecedor|Salvar alterações/ })
  }

  formError(): Locator {
    return this.modal().locator('p.text-destructive')
  }

  companyNameError(): Locator {
    return this.modal().getByText('Razão social é obrigatória')
  }

  emailError(): Locator {
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

  emptyState(): Locator {
    return this.page.getByText('Nenhum fornecedor encontrado')
  }

  // ── Helpers de alto nível ──────────────────────────────────────────────────

  async openNewSupplierModal() {
    await this.btnNovoFornecedor().click()
    await this.modal().waitFor({ state: 'visible' })
  }

  async openEditModal(supplierName: string) {
    await this.editButtonForRow(supplierName).click()
    await this.modal().waitFor({ state: 'visible' })
  }

  async fillForm(data: SupplierFormData) {
    if (data.companyName !== undefined) await this.fieldCompanyName().fill(data.companyName)
    if (data.tradeName !== undefined) await this.fieldTradeName().fill(data.tradeName)
    if (data.cnpj !== undefined) await this.fieldCnpj().fill(data.cnpj)
    if (data.phone !== undefined) await this.fieldPhone().fill(data.phone)
    if (data.email !== undefined) await this.fieldEmail().fill(data.email)
    if (data.address !== undefined) await this.fieldAddress().fill(data.address)
    if (data.deliveryDays !== undefined) await this.fieldDeliveryDays().fill(data.deliveryDays)
    if (data.notes !== undefined) await this.fieldNotes().fill(data.notes)
  }

  async submitForm() {
    await this.submitButton().click()
  }

  async createSupplier(data: SupplierFormData) {
    await this.openNewSupplierModal()
    await this.fillForm(data)
    await this.submitForm()
    await this.modal().waitFor({ state: 'hidden' })
  }
}
