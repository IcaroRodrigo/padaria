import { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.page.getByPlaceholder('seu@email.com').fill(email)
    await this.page.getByPlaceholder('••••••••').fill(password)
    await this.page.getByRole('button', { name: 'Acessar minha conta' }).click()
  }

  async loginAsAdmin() {
    await this.goto()
    await this.login('admin@panificadora.com', 'Admin@123')
    await this.page.waitForURL('**/dashboard')
  }

  async loginAsCaixa() {
    await this.goto()
    await this.login('caixa@panificadora.com', 'Caixa@123')
    await this.page.waitForURL('**/pdv')
  }

  errorMessage() {
    return this.page.locator('[role="alert"]').first()
  }
}
