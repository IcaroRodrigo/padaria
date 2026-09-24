import { test as base, Page } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { ProdutosPage } from '../pages/ProdutosPage'

type AuthFixtures = {
  loginPage: LoginPage
  produtosPage: ProdutosPage
  adminPage: Page
  caixaPage: Page
}

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },

  produtosPage: async ({ page }, use) => {
    await use(new ProdutosPage(page))
  },

  // Página já autenticada como admin
  adminPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.loginAsAdmin()
    await use(page)
  },

  // Página já autenticada como caixa
  caixaPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await loginPage.loginAsCaixa()
    await use(page)
  },
})

export { expect } from '@playwright/test'
