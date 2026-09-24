# Panificadora SaaS — Instruções para o Claude

## Sobre o Projeto

Sistema de gestão SaaS multi-tenant para **panificadoras**. Cada cliente (empresa) tem seus próprios produtos, caixa, despesas, clientes e fornecedores isolados por `empresaId`.

**Stack:**
- Backend: NestJS + Prisma 5.14 + MariaDB (porta 3001)
- Frontend: Next.js 14 + Tailwind + Zustand + React Query (porta 3000)
- Auth: JWT com refresh token
- Node.js 20.16 — **NÃO atualizar Prisma além da versão 5.14** (versões mais novas exigem Node 20.19+)

**Para rodar o projeto:**
```bash
# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev
```

---

## Banco de Dados (desenvolvimento local)

- Banco: `panificadora`
- String de conexão padrão: `mysql://root:root@localhost:3306/panificadora`
- Ajustar `backend/.env` conforme o ambiente

---

## Usuários padrão (seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@panificadora.com | Admin@123 |
| Caixa | caixa@panificadora.com | Caixa@123 |

---

## Módulos Implementados

- Auth (JWT com refresh token, recuperação de senha, cadastro com verificação de e-mail)
- Produtos + Categorias + PLU
- PDV / Caixa (abertura, fechamento, venda, cancelamento, múltiplos meios de pagamento)
- Clientes
- Fornecedores
- Despesas (fixas/variáveis, recorrência)
- Dashboard e Relatórios
- Estoque (entradas)
- Notas Fiscais (NF-e/NFC-e via FocusNFe)
- Exportação para Balança
- Configurações por empresa

---

## Categorias Padrão (Panificadora)

| # | Categoria |
|---|-----------|
| 1 | Pães |
| 2 | Bolos e Tortas |
| 3 | Salgados |
| 4 | Doces e Confeitaria |
| 5 | Bebidas |
| 6 | Frios e Laticínios |
| 7 | Embutidos |
| 8 | Produtos Naturais |
| 9 | Biscoitos e Snacks |
| 10 | Outros |

---

## Regras de Cadastro de Produtos

- **Unidade:** `kg`, `un` (unidade), `dz` (dúzia), `L` (litro). Nunca usar `g` ou `ml`.
- **PLU:** Todo produto pesado (balança) deve ter PLU único e sequencial.
- **Preço de custo:** Sempre preencher.

---

## Balança Toledo Prix 4 Uno

- Conectividade: Ethernet / WLAN / USB
- Software: **MGV7** (on-premise, Windows) ou MGV Cloud
- O formato exato de exportação será confirmado em teste com o lead que possui a balança
- A leitura de etiquetas no PDV usa EAN-13 com prefixo `2` (igual às demais balanças Toledo)
- O endpoint de exportação (`GET /api/products/export/balanca`) será adaptado quando o formato MGV7 for confirmado

---

## Multi-tenant

- Cada empresa tem `empresaId` isolando todos os dados
- O `empresaId` vem do JWT (campo `empresaId` no payload)
- O nome da empresa (`empresa.nome`) é retornado no login e exibido dinamicamente na sidebar
- **Nunca** usar `empresaId` hardcoded — sempre vir do usuário autenticado

---

## Identidade Visual (padrão)

- Ícone: Cookie (lucide-react)
- Cores: configuráveis por tenant futuramente; padrão âmbar/trigo

---

## Chave PIX

- Formato obrigatório: `+55XXXXXXXXXXX` (com `+55`, sem espaços) para chave telefone
