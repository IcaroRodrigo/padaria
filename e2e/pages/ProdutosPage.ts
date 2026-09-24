import { Page, Locator } from '@playwright/test'

export interface ProductFormData {
  name: string
  description?: string
  categoryId?: string     // valor do option (ID da categoria, ex: '1', '2')
  unit?: string           // valor do option: kg, g, unidade, litro, ml, cx, pct
  costPrice?: string
  salePrice?: string
  barcode?: string
  plu?: string
  expirationDate?: string // YYYY-MM-DD
  stockQty?: string
  minStockQty?: string
}

export class ProdutosPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/produtos')
  }

  // ── Botões principais ──────────────────────────────────────────────────────

  btnNovoProduto(): Locator {
    return this.page.getByRole('button', { name: /Novo Produto/ })
  }

  btnExportarBalanca(): Locator {
    return this.page.getByRole('button', { name: /Exportar Balança/ })
  }

  // ── Filtros da listagem (fora do modal) ────────────────────────────────────

  searchInput(): Locator {
    return this.page.getByPlaceholder('Buscar por nome ou código de barras...')
  }

  categoryFilter(): Locator {
    return this.page.locator('div.flex.gap-3 select').first()
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  // O Modal renderiza como div.fixed.inset-0.z-50 (sem role="dialog")

  modal(): Locator {
    return this.page.locator('div.fixed.inset-0.z-50')
  }

  modalTitle(): Locator {
    return this.modal().locator('h2')
  }

  // ── Campos do formulário (escopados ao modal) ──────────────────────────────

  fieldName(): Locator {
    return this.modal().getByPlaceholder('Ex: Chá de Camomila')
  }

  fieldDescription(): Locator {
    return this.modal().getByPlaceholder('Descrição opcional...')
  }

  fieldCategory(): Locator {
    return this.modal().locator('select').nth(0)
  }

  fieldUnit(): Locator {
    return this.modal().locator('select').nth(1)
  }

  fieldCostPrice(): Locator {
    return this.modal().locator('input[name="costPrice"]')
  }

  fieldSalePrice(): Locator {
    return this.modal().locator('input[name="salePrice"]')
  }

  fieldBarcode(): Locator {
    return this.modal().locator('input[name="barcode"]')
  }

  fieldPlu(): Locator {
    return this.modal().locator('input[name="plu"]')
  }

  fieldExpirationDate(): Locator {
    return this.modal().locator('input[name="expirationDate"]')
  }

  fieldSupplier(): Locator {
    return this.modal().locator('select[name="supplierId"]')
  }

  fieldStockQty(): Locator {
    return this.modal().locator('input[name="stockQty"]')
  }

  fieldMinStockQty(): Locator {
    return this.modal().locator('input[name="minStockQty"]')
  }

  marginDisplay(): Locator {
    return this.modal().locator('.bg-green-50')
  }

  submitButton(): Locator {
    return this.modal().getByRole('button', { name: /Cadastrar produto|Salvar alterações/ })
  }

  formError(): Locator {
    return this.modal().locator('.bg-red-50')
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

  toggleButtonForRow(name: string): Locator {
    return this.rowByName(name).getByTitle(/Desativar|Ativar/)
  }

  emptyState(): Locator {
    return this.page.getByText('Nenhum produto encontrado')
  }

  // ── Helpers de alto nível ──────────────────────────────────────────────────

  async openNewProductModal() {
    await this.btnNovoProduto().click()
    await this.modal().waitFor({ state: 'visible' })
  }

  async openEditModal(productName: string) {
    await this.editButtonForRow(productName).click()
    await this.modal().waitFor({ state: 'visible' })
  }

  async fillForm(data: ProductFormData) {
    if (data.name !== undefined) {
      await this.fieldName().fill(data.name)
    }
    if (data.description !== undefined) {
      await this.fieldDescription().fill(data.description)
    }
    if (data.categoryId !== undefined) {
      // Seleciona por valor (ID) — robusto contra mudança de ordem das opções
      await this.fieldCategory().selectOption({ value: data.categoryId })
    }
    if (data.unit !== undefined) {
      await this.fieldUnit().selectOption(data.unit)
    }
    if (data.costPrice !== undefined) {
      await this.fieldCostPrice().fill(data.costPrice)
    }
    if (data.salePrice !== undefined) {
      await this.fieldSalePrice().fill(data.salePrice)
    }
    if (data.barcode !== undefined) {
      await this.fieldBarcode().fill(data.barcode)
    }
    if (data.plu !== undefined) {
      await this.fieldPlu().fill(data.plu)
    }
    if (data.expirationDate !== undefined) {
      await this.fieldExpirationDate().fill(data.expirationDate)
    }
    if (data.stockQty !== undefined) {
      await this.fieldStockQty().fill(data.stockQty)
    }
    if (data.minStockQty !== undefined) {
      await this.fieldMinStockQty().fill(data.minStockQty)
    }
  }

  async submitForm() {
    await this.submitButton().click()
  }

  async createProduct(data: ProductFormData) {
    await this.openNewProductModal()
    await this.fillForm(data)
    await this.submitForm()
    await this.modal().waitFor({ state: 'hidden' })
  }
}
