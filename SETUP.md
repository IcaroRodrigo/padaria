# Casa Granella — Setup

## Pré-requisitos
- Node.js 20.16+
- MariaDB / MySQL rodando localmente

## 1. Banco de dados

Crie o banco no MariaDB:
```sql
CREATE DATABASE casa_granella CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Edite `backend/.env` com suas credenciais:
```
DATABASE_URL="mysql://SEU_USER:SUA_SENHA@localhost:3306/casa_granella"
```

## 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init    # cria as tabelas
npx prisma db seed                     # popula categorias e usuários iniciais
npm run start:dev                      # roda em http://localhost:3001
```

### Usuários iniciais (após seed)
| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@casagranella.com | admin123 |
| Caixa | caixa@casagranella.com | operador123 |

## 3. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev    # roda em http://localhost:3000
```

## Desenvolvimento simultâneo

Na raiz do projeto:
```bash
npm install
npm run dev
```

## Estrutura
```
casa-granella/
├── backend/          NestJS + Prisma + MariaDB
│   ├── src/
│   │   ├── auth/         Autenticação JWT
│   │   ├── users/        Usuários
│   │   ├── products/     Produtos + Categorias
│   │   ├── customers/    Clientes
│   │   ├── suppliers/    Fornecedores
│   │   ├── sales/        Vendas + PDV + Caixa
│   │   ├── expenses/     Despesas
│   │   └── dashboard/    Dashboard e relatórios
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
└── frontend/         Next.js 14 + Tailwind + shadcn
    ├── app/
    │   ├── (auth)/login
    │   └── (dashboard)/
    │       ├── dashboard/
    │       ├── pdv/
    │       ├── produtos/
    │       ├── clientes/
    │       ├── fornecedores/
    │       ├── despesas/
    │       └── relatorios/
    ├── components/
    ├── lib/
    ├── store/
    └── types/
```

## API — principais endpoints

### Auth
- `POST /api/auth/login` — login
- `POST /api/auth/refresh` — refresh token
- `GET /api/auth/me` — perfil atual

### Produtos
- `GET /api/products` — listar (query: search, categoryId, active, expiringDays)
- `POST /api/products` — criar (ADMIN)
- `GET /api/products/categories` — categorias
- `GET /api/products/barcode/:barcode` — buscar por código de barras

### PDV
- `POST /api/sales/cash-register/open` — abrir caixa
- `POST /api/sales/cash-register/:id/close` — fechar caixa
- `GET /api/sales/cash-register/current` — caixa atual
- `POST /api/sales` — criar venda
- `PATCH /api/sales/:id/cancel` — cancelar venda

### Dashboard
- `GET /api/dashboard/overview` — visão geral
- `GET /api/dashboard/revenue?startDate=&endDate=&groupBy=day|month`
- `GET /api/dashboard/payment-methods?startDate=&endDate=`
- `GET /api/dashboard/top-products?startDate=&endDate=`
- `GET /api/dashboard/cash-flow?startDate=&endDate=`
