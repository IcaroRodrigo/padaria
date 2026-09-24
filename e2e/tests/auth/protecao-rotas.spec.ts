import { test, expect } from '../../fixtures/auth.fixture'

test.describe('Proteção de Rotas', () => {
  test('redireciona /produtos para /login quando não autenticado', async ({ page }) => {
    await page.goto('/produtos')
    await expect(page).toHaveURL(/\/login/)
  })

  test('redireciona /dashboard para /login quando não autenticado', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('admin é redirecionado para /dashboard após login', async ({ loginPage, page }) => {
    await loginPage.loginAsAdmin()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('caixa é redirecionado para /pdv após login', async ({ loginPage, page }) => {
    await loginPage.loginAsCaixa()
    await expect(page).toHaveURL(/\/pdv/)
  })

  test('credenciais inválidas exibem mensagem de erro', async ({ loginPage }) => {
    await loginPage.goto()
    await loginPage.login('naoexiste@teste.com', 'senhaerrada')
    await expect(loginPage.errorMessage()).toBeVisible()
  })

  test('senha vazia exibe erro de validação no formulário', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('seu@email.com').fill('admin@casagranella.com')
    await page.getByRole('button', { name: 'Acessar minha conta' }).click()
    await expect(page.getByText('Senha é obrigatória')).toBeVisible()
  })

  test('e-mail inválido bloqueia envio do formulário (validação nativa do browser)', async ({ page }) => {
    // O input type="email" usa validação HTML5 nativa — o browser impede o submit
    // antes de o Zod rodar, portanto o usuário permanece na página de login.
    await page.goto('/login')
    await page.getByPlaceholder('seu@email.com').fill('nao-e-email')
    await page.getByPlaceholder('••••••••').fill('qualquercoisa')
    await page.getByRole('button', { name: 'Acessar minha conta' }).click()
    // Formulário não é submetido — URL permanece /login
    await expect(page).toHaveURL(/\/login/)
    // A mensagem customizada do Zod ('E-mail inválido') é inacessível neste cenário
    // BUG MENOR: caso o browser seja desabilitado ou via API, a mensagem custom não aparece
  })
})
