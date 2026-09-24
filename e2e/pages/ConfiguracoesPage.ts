import { Page, Locator } from '@playwright/test'

export class ConfiguracoesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/configuracoes')
  }

  heading(): Locator {
    return this.page.getByRole('heading', { name: 'Configurações' })
  }

  // ── Dados da loja ─────────────────────────────────────────────────────────

  fieldStoreName(): Locator {
    return this.page.getByPlaceholder('Casa Granella')
  }

  fieldStoreCity(): Locator {
    return this.page.getByPlaceholder('SAO PAULO')
  }

  // ── PIX ───────────────────────────────────────────────────────────────────

  // A página usa value/onChange diretamente (sem react-hook-form), então não há name=.
  // Os selects aparecem na ordem: pix_key_type (1º), scale_format (2º).
  fieldPixKeyType(): Locator {
    return this.page.locator('select').nth(0)
  }

  fieldPixKey(): Locator {
    return this.page.getByPlaceholder('CPF, e-mail, telefone ou chave')
  }

  fieldPixMerchantName(): Locator {
    return this.page.getByPlaceholder('CASA GRANELLA')
  }

  // ── Balança ───────────────────────────────────────────────────────────────

  fieldScaleFormat(): Locator {
    return this.page.locator('select').nth(1)
  }

  // Inputs numéricos da seção Balança (scale_plu_digits, scale_value_digits)
  fieldPluDigits(): Locator {
    return this.page.locator('input[type="number"]').nth(0)
  }

  fieldValueDigits(): Locator {
    return this.page.locator('input[type="number"]').nth(1)
  }

  // ── Ações ─────────────────────────────────────────────────────────────────

  btnSalvar(): Locator {
    return this.page.getByRole('button', { name: 'Salvar configurações' })
  }

  successMessage(): Locator {
    return this.page.getByText('Salvo com sucesso')
  }

  errorMessage(): Locator {
    return this.page.locator('.text-destructive')
  }
}
