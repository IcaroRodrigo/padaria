/**
 * Testes E2E — Módulo: Clientes
 *
 * Cobertura:
 *   - Listagem: heading, colunas da tabela, botão "Novo Cliente", estado vazio na busca
 *   - Cadastro Happy Path: campos obrigatórios, todos os campos, visibilidade na tabela,
 *     título do modal, texto do botão de submit, incremento do contador
 *   - Cadastro Sad Path: nome obrigatório, e-mail inválido, modal permanece aberto
 *   - Edição: título do modal, pré-carga do nome, alteração de nome, alteração de telefone
 *   - Busca: filtro por nome, estado vazio para busca sem resultado
 *   - Perfil: modal "Perfil do Cliente" via botão de visualização
 */

import { test, expect } from '../../fixtures/auth.fixture'
import { ClientesPage } from '../../pages/ClientesPage'

const uid = () => Date.now().toString().slice(-6)

test.describe('Listagem de Clientes', () => {
  let clientesPage: ClientesPage

  test.beforeEach(async ({ adminPage }) => {
    clientesPage = new ClientesPage(adminPage)
    await clientesPage.goto()
  })

  test('TC-050 — página de clientes carrega com heading correto', async ({ adminPage }) => {
    await expect(adminPage.getByRole('heading', { name: 'Clientes' })).toBeVisible()
  })

  test('TC-051 — tabela exibe colunas esperadas', async ({ adminPage }) => {
    await expect(adminPage.getByRole('columnheader', { name: 'Nome' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'CPF' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Telefone' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'E-mail' })).toBeVisible()
    await expect(adminPage.getByRole('columnheader', { name: 'Cadastro' })).toBeVisible()
  })

  test('TC-052 — botão "Novo Cliente" está visível', async () => {
    await expect(clientesPage.btnNovoCliente()).toBeVisible()
  })

  test('TC-053 — busca por termo inexistente exibe estado vazio', async () => {
    await clientesPage.searchInput().fill('xyzClienteInexistente999')
    await clientesPage.emptyState().waitFor({ state: 'visible' })
    await expect(clientesPage.emptyState()).toBeVisible()
  })
})

test.describe('Cadastro de Clientes — Happy Path', () => {
  let clientesPage: ClientesPage

  test.beforeEach(async ({ adminPage }) => {
    clientesPage = new ClientesPage(adminPage)
    await clientesPage.goto()
  })

  test('TC-054 — deve cadastrar cliente somente com o nome', async () => {
    const nome = `Cliente Simples ${uid()}`

    await clientesPage.createCustomer({ name: nome })

    await expect(clientesPage.rowByName(nome)).toBeVisible()
  })

  test('TC-055 — deve cadastrar cliente com todos os campos preenchidos', async () => {
    const nome = `Cliente Completo ${uid()}`

    await clientesPage.createCustomer({
      name: nome,
      cpf: '123.456.789-09',
      phone: '(41) 99999-0001',
      email: `completo${uid()}@email.com`,
      address: 'Rua das Flores, 123, Colombo-PR',
      notes: 'Cliente preferencial — pagamento à vista',
    })

    await expect(clientesPage.rowByName(nome)).toBeVisible()
  })

  test('TC-056 — cliente criado aparece na tabela após cadastro', async () => {
    const nome = `Cliente Tabela ${uid()}`

    await clientesPage.createCustomer({ name: nome })

    await clientesPage.rowByName(nome).waitFor({ state: 'visible' })
    await expect(clientesPage.rowByName(nome)).toBeVisible()
  })

  test('TC-057 — modal de criação exibe título "Novo Cliente"', async () => {
    await clientesPage.openNewCustomerModal()

    await expect(clientesPage.modalTitle()).toHaveText('Novo Cliente')
  })

  test('TC-058 — modal de criação exibe botão "Cadastrar cliente"', async () => {
    await clientesPage.openNewCustomerModal()

    await expect(clientesPage.submitButton()).toHaveText('Cadastrar cliente')
  })

  test('TC-059 — contador de clientes incrementa após cadastro', async ({ adminPage }) => {
    // Lê o contador antes do cadastro
    const counterLocator = adminPage.getByText(/clientes cadastrados/)
    await counterLocator.waitFor({ state: 'visible' })
    const textoBefore = await counterLocator.textContent() ?? ''
    const matchBefore = textoBefore.match(/(\d+)/)
    const countBefore = matchBefore ? parseInt(matchBefore[1], 10) : 0

    await clientesPage.createCustomer({ name: `Cliente Contador ${uid()}` })

    const textoAfter = await counterLocator.textContent() ?? ''
    const matchAfter = textoAfter.match(/(\d+)/)
    const countAfter = matchAfter ? parseInt(matchAfter[1], 10) : 0

    expect(countAfter).toBe(countBefore + 1)
  })
})

test.describe('Cadastro de Clientes — Sad Path', () => {
  let clientesPage: ClientesPage

  test.beforeEach(async ({ adminPage }) => {
    clientesPage = new ClientesPage(adminPage)
    await clientesPage.goto()
    await clientesPage.openNewCustomerModal()
  })

  test('TC-060 — deve bloquear envio quando nome está vazio', async () => {
    await clientesPage.submitForm()

    await expect(clientesPage.modal()).toBeVisible()
    await expect(clientesPage.fieldNameError()).toBeVisible()
  })

  test('TC-061 — deve exibir erro de e-mail inválido', async () => {
    await clientesPage.fillForm({
      name: `Cliente Email Inválido ${uid()}`,
      email: 'emailnaovalidado',
    })
    await clientesPage.submitForm()

    await expect(clientesPage.modal()).toBeVisible()
    await expect(clientesPage.fieldEmailError()).toBeVisible()
  })

  test('TC-062 — modal permanece aberto quando há erro de validação', async () => {
    // Tenta submeter sem nome e confirma que o modal não fecha
    await clientesPage.submitForm()

    await expect(clientesPage.modal()).toBeVisible()
  })
})

test.describe('Edição de Clientes', () => {
  let clientesPage: ClientesPage

  test.beforeEach(async ({ adminPage }) => {
    clientesPage = new ClientesPage(adminPage)
    await clientesPage.goto()
  })

  test('TC-063 — modal de edição exibe título "Editar Cliente"', async () => {
    const nome = `Cliente Para Editar Título ${uid()}`
    await clientesPage.createCustomer({ name: nome })

    await clientesPage.openEditModal(nome)

    await expect(clientesPage.modalTitle()).toHaveText('Editar Cliente')
  })

  test('TC-064 — modal de edição pré-carrega o nome do cliente', async () => {
    const nome = `Cliente Para Editar Nome ${uid()}`
    await clientesPage.createCustomer({ name: nome })

    await clientesPage.openEditModal(nome)

    await expect(clientesPage.fieldName()).toHaveValue(nome)
  })

  test('TC-065 — deve salvar alteração do nome e refletir na tabela', async () => {
    const nomeOriginal = `Cliente Original ${uid()}`
    await clientesPage.createCustomer({ name: nomeOriginal })

    const nomeNovo = `CLIENTE RENOMEADO ${uid()}`
    await clientesPage.openEditModal(nomeOriginal)
    await clientesPage.fieldName().clear()
    await clientesPage.fieldName().fill(nomeNovo)
    await clientesPage.submitForm()
    await clientesPage.modal().waitFor({ state: 'hidden' })

    await expect(clientesPage.rowByName(nomeNovo)).toBeVisible()
    await expect(clientesPage.rowByName(nomeOriginal)).toBeHidden()
  })

  test('TC-066 — deve salvar alteração de telefone e persistir na edição', async () => {
    const nome = `Cliente Fone ${uid()}`
    await clientesPage.createCustomer({ name: nome, phone: '(41) 98888-0001' })

    const novoTelefone = '(41) 97777-0002'
    await clientesPage.openEditModal(nome)
    await clientesPage.fieldPhone().clear()
    await clientesPage.fieldPhone().fill(novoTelefone)
    await clientesPage.submitForm()
    await clientesPage.modal().waitFor({ state: 'hidden' })

    // Reabre o modal para verificar o valor salvo
    await clientesPage.openEditModal(nome)
    await expect(clientesPage.fieldPhone()).toHaveValue(novoTelefone)
  })
})

test.describe('Busca de Clientes', () => {
  let clientesPage: ClientesPage

  test.beforeEach(async ({ adminPage }) => {
    clientesPage = new ClientesPage(adminPage)
    await clientesPage.goto()
  })

  test('TC-067 — deve filtrar clientes pelo nome via campo de busca', async () => {
    const termoBusca = `BuscaUnica${uid()}`
    const nome = `Cliente ${termoBusca}`

    await clientesPage.createCustomer({ name: nome })

    await clientesPage.searchInput().fill(termoBusca)
    await clientesPage.rowByName(nome).waitFor({ state: 'visible' })
    await expect(clientesPage.rowByName(nome)).toBeVisible()
  })

  test('TC-068 — busca por nome inexistente exibe estado vazio', async () => {
    await clientesPage.searchInput().fill('xyzClienteAbsolutamenteInexistente000')
    await clientesPage.emptyState().waitFor({ state: 'visible' })
    await expect(clientesPage.emptyState()).toBeVisible()
  })
})

test.describe('Perfil do Cliente', () => {
  let clientesPage: ClientesPage

  test.beforeEach(async ({ adminPage }) => {
    clientesPage = new ClientesPage(adminPage)
    await clientesPage.goto()
  })

  test('TC-069 — botão de visualização abre modal com título "Perfil do Cliente"', async () => {
    const nome = `Cliente Perfil ${uid()}`
    await clientesPage.createCustomer({ name: nome })

    await clientesPage.openDetailModal(nome)

    await expect(clientesPage.modalTitle()).toHaveText('Perfil do Cliente')
  })
})
