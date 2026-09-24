/**
 * Testes E2E — Módulo: Fornecedores
 *
 * Cobertura:
 *   - Listagem: heading, colunas da tabela, botão "Novo Fornecedor", texto do contador
 *   - Cadastro Happy Path: somente razão social, todos os campos, nome fantasia na tabela,
 *     título do modal, texto do botão de submit, prazo de entrega na tabela
 *   - Cadastro Sad Path: razão social obrigatória, e-mail inválido, modal permanece aberto
 *   - Edição: título do modal, pré-carga da razão social, alteração de razão social,
 *     alteração de prazo de entrega
 *   - Busca: filtro por nome, estado vazio para busca sem resultado
 *   - Autorização: perfil caixa não deve acessar /fornecedores
 */

import { test, expect } from '../../fixtures/auth.fixture'
import { FornecedoresPage } from '../../pages/FornecedoresPage'

const uid = () => Date.now().toString().slice(-6)

test.describe('Listagem de Fornecedores', () => {
  let fornecedoresPage: FornecedoresPage

  test.beforeEach(async ({ adminPage }) => {
    fornecedoresPage = new FornecedoresPage(adminPage)
    await fornecedoresPage.goto()
  })

  test('TC-070 — página de fornecedores carrega com heading correto', async ({ adminPage }) => {
    await expect(adminPage.getByRole('heading', { name: 'Fornecedores' })).toBeVisible()
  })

  test('TC-071 — tabela exibe colunas esperadas', async ({ adminPage }) => {
    await expect(adminPage.getByRole('columnheader', { name: 'Empresa' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'CNPJ' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Telefone' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'E-mail' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: /Entrega/ })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Cadastro' })).toBeVisible()
  })

  test('TC-072 — botão "Novo Fornecedor" está visível', async () => {
    await expect(fornecedoresPage.btnNovoFornecedor()).toBeVisible()
  })

  test('TC-073 — contador de fornecedores está visível na página', async ({ adminPage }) => {
    await expect(adminPage.getByText(/fornecedores cadastrados/)).toBeVisible()
  })
})

test.describe('Cadastro de Fornecedores — Happy Path', () => {
  let fornecedoresPage: FornecedoresPage

  test.beforeEach(async ({ adminPage }) => {
    fornecedoresPage = new FornecedoresPage(adminPage)
    await fornecedoresPage.goto()
  })

  test('TC-074 — deve cadastrar fornecedor somente com a razão social', async () => {
    const razaoSocial = `Fornecedor Simples ${uid()}`

    await fornecedoresPage.createSupplier({ companyName: razaoSocial })

    await expect(fornecedoresPage.rowByName(razaoSocial)).toBeVisible()
  })

  test('TC-075 — deve cadastrar fornecedor com todos os campos preenchidos', async () => {
    const razaoSocial = `Distribuidora Completa ${uid()} LTDA`

    await fornecedoresPage.createSupplier({
      companyName: razaoSocial,
      tradeName: `Distribuidora ${uid()}`,
      cnpj: '12.345.678/0001-90',
      phone: '(41) 99990-0001',
      email: `forn${uid()}@empresa.com`,
      address: 'Av. das Indústrias, 500, Colombo-PR',
      deliveryDays: '3',
      notes: 'Fornecedor principal de grãos',
    })

    await expect(fornecedoresPage.rowByName(razaoSocial)).toBeVisible()
  })

  test('TC-076 — nome fantasia (tradeName) aparece na tabela', async () => {
    const razaoSocial = `Empresa Principal ${uid()} ME`
    const nomeFantasia = `NomeFantasia${uid()}`

    await fornecedoresPage.createSupplier({
      companyName: razaoSocial,
      tradeName: nomeFantasia,
    })

    await expect(fornecedoresPage.rowByName(razaoSocial)).toBeVisible()
    await expect(fornecedoresPage.rowByName(razaoSocial).getByText(nomeFantasia)).toBeVisible()
  })

  test('TC-077 — modal de criação exibe título "Novo Fornecedor"', async () => {
    await fornecedoresPage.openNewSupplierModal()

    await expect(fornecedoresPage.modalTitle()).toHaveText('Novo Fornecedor')
  })

  test('TC-078 — modal de criação exibe botão "Cadastrar fornecedor"', async () => {
    await fornecedoresPage.openNewSupplierModal()

    await expect(fornecedoresPage.submitButton()).toHaveText('Cadastrar fornecedor')
  })

  test('TC-079 — prazo de entrega em dias aparece na tabela após cadastro', async () => {
    const razaoSocial = `Fornecedor Prazo ${uid()}`

    await fornecedoresPage.createSupplier({
      companyName: razaoSocial,
      deliveryDays: '5',
    })

    await expect(fornecedoresPage.rowByName(razaoSocial)).toBeVisible()
    await expect(fornecedoresPage.rowByName(razaoSocial).getByText('5')).toBeVisible()
  })
})

test.describe('Cadastro de Fornecedores — Sad Path', () => {
  let fornecedoresPage: FornecedoresPage

  test.beforeEach(async ({ adminPage }) => {
    fornecedoresPage = new FornecedoresPage(adminPage)
    await fornecedoresPage.goto()
    await fornecedoresPage.openNewSupplierModal()
  })

  test('TC-080 — deve bloquear envio quando razão social está vazia', async () => {
    await fornecedoresPage.submitForm()

    await expect(fornecedoresPage.modal()).toBeVisible()
    await expect(fornecedoresPage.companyNameError()).toBeVisible()
  })

  test('TC-081 — deve exibir erro de e-mail inválido', async () => {
    await fornecedoresPage.fillForm({
      companyName: `Fornecedor Email Inválido ${uid()}`,
      email: 'emailnaovalidado',
    })
    await fornecedoresPage.submitForm()

    await expect(fornecedoresPage.modal()).toBeVisible()
    await expect(fornecedoresPage.emailError()).toBeVisible()
  })

  test('TC-082 — modal permanece aberto quando há erro de validação', async () => {
    // Tenta submeter sem razão social e confirma que o modal não fecha
    await fornecedoresPage.submitForm()

    await expect(fornecedoresPage.modal()).toBeVisible()
  })
})

test.describe('Edição de Fornecedores', () => {
  let fornecedoresPage: FornecedoresPage

  test.beforeEach(async ({ adminPage }) => {
    fornecedoresPage = new FornecedoresPage(adminPage)
    await fornecedoresPage.goto()
  })

  test('TC-083 — modal de edição exibe título "Editar Fornecedor"', async () => {
    const razaoSocial = `Fornecedor Editar Título ${uid()}`
    await fornecedoresPage.createSupplier({ companyName: razaoSocial })

    await fornecedoresPage.openEditModal(razaoSocial)

    await expect(fornecedoresPage.modalTitle()).toHaveText('Editar Fornecedor')
  })

  test('TC-084 — modal de edição pré-carrega a razão social', async () => {
    const razaoSocial = `Fornecedor Pré-carga ${uid()}`
    await fornecedoresPage.createSupplier({ companyName: razaoSocial })

    await fornecedoresPage.openEditModal(razaoSocial)

    await expect(fornecedoresPage.fieldCompanyName()).toHaveValue(razaoSocial)
  })

  test('TC-085 — deve salvar alteração da razão social e refletir na tabela', async () => {
    const razaoSocialOriginal = `Fornecedor Original ${uid()}`
    await fornecedoresPage.createSupplier({ companyName: razaoSocialOriginal })

    const razaoSocialNova = `FORNECEDOR RENOMEADO ${uid()}`
    await fornecedoresPage.openEditModal(razaoSocialOriginal)
    await fornecedoresPage.fieldCompanyName().clear()
    await fornecedoresPage.fieldCompanyName().fill(razaoSocialNova)
    await fornecedoresPage.submitForm()
    await fornecedoresPage.modal().waitFor({ state: 'hidden' })

    await expect(fornecedoresPage.rowByName(razaoSocialNova)).toBeVisible()
    await expect(fornecedoresPage.rowByName(razaoSocialOriginal)).toBeHidden()
  })

  test('TC-086 — deve salvar alteração do prazo de entrega e persistir na edição', async () => {
    const razaoSocial = `Fornecedor Prazo Edit ${uid()}`
    await fornecedoresPage.createSupplier({ companyName: razaoSocial, deliveryDays: '2' })

    await fornecedoresPage.openEditModal(razaoSocial)
    await fornecedoresPage.fieldDeliveryDays().clear()
    await fornecedoresPage.fieldDeliveryDays().fill('7')
    await fornecedoresPage.submitForm()
    await fornecedoresPage.modal().waitFor({ state: 'hidden' })

    // Reabre o modal para verificar o valor salvo
    await fornecedoresPage.openEditModal(razaoSocial)
    await expect(fornecedoresPage.fieldDeliveryDays()).toHaveValue('7')
  })
})

test.describe('Busca de Fornecedores', () => {
  let fornecedoresPage: FornecedoresPage

  test.beforeEach(async ({ adminPage }) => {
    fornecedoresPage = new FornecedoresPage(adminPage)
    await fornecedoresPage.goto()
  })

  test('TC-087 — deve filtrar fornecedores pelo nome via campo de busca', async () => {
    const termoBusca = `BuscaForn${uid()}`
    const razaoSocial = `Empresa ${termoBusca} LTDA`

    await fornecedoresPage.createSupplier({ companyName: razaoSocial })

    await fornecedoresPage.searchInput().fill(termoBusca)
    await fornecedoresPage.rowByName(razaoSocial).waitFor({ state: 'visible' })
    await expect(fornecedoresPage.rowByName(razaoSocial)).toBeVisible()
  })

  test('TC-088 — busca por nome inexistente exibe estado vazio', async () => {
    await fornecedoresPage.searchInput().fill('xyzFornecedorAbsolutamenteInexistente000')
    await fornecedoresPage.emptyState().waitFor({ state: 'visible' })
    await expect(fornecedoresPage.emptyState()).toBeVisible()
  })
})

test.describe('Autorização — Perfil Caixa', () => {
  test('TC-089 — [BUG #4] usuário caixa acessa /fornecedores sem ser redirecionado', async ({ caixaPage }) => {
    // BUG #4 (Security / Major): a rota /fornecedores não restringe o perfil CAIXA.
    // O usuário caixa consegue visualizar e acessar a gestão de fornecedores, incluindo
    // o botão "Novo Fornecedor" e os dados de todos os fornecedores cadastrados, que
    // deveriam ser exclusivos do ADMIN.
    // Fix sugerido: adicionar verificação de role no middleware/guard da rota /fornecedores
    // ou no componente de layout para redirecionar CAIXA para /pdv.
    await caixaPage.goto('/fornecedores')

    // OBTIDO (bug): caixa permanece em /fornecedores sem redirecionamento
    await expect(caixaPage).toHaveURL(/\/fornecedores/)
  })
})
