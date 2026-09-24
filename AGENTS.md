# Casa Granella — Instruções para o Codex

## Sobre o Projeto

Sistema de gestão completo para a **Casa Granella**, loja física de produtos naturais localizada em **Colombo, Paraná** (região metropolitana de Curitiba).

**Stack:**
- Backend: NestJS + Prisma 5.14 + MariaDB (porta 3001)
- Frontend: Next.js 14 + Tailwind + Zustand + React Query (porta 3000)
- Auth: JWT
- Node.js 20.16 — **NÃO atualizar Prisma além da versão 5.14** (versões mais novas exigem Node 20.19+)

**Banco de dados:** MariaDB local
- Usuário: `granella` / Senha: `granella123`
- Banco: `casa_granella`
- String de conexão: `mysql://granella:granella123@localhost:3306/casa_granella`

**Para rodar o projeto:**
```bash
# Backend
cd backend && npm run start:dev

# Frontend
cd frontend && npm run dev
```

---

## Regras de Pesquisa de Preços

Sempre que for pesquisar preços de produtos naturais para cadastro ou atualização:

1. **Referência geográfica:** Colombo PR / Curitiba / Região Metropolitana de Curitiba. Os preços devem refletir o varejo praticado nessa região.

2. **Tipo de preço:** Sempre buscar preço de **varejo** (não atacado/wholesale). O atacado é referência de custo, não de venda.

3. **Unidade padrão:** Todos os preços devem ser cadastrados **por kg** (sólidos) ou **por litro** (líquidos). Nunca cadastrar preços por 100g ou por unidade de embalagem.

4. **Fontes confiáveis para pesquisa:**
   - camomilacuritiba.com.br (Empório Natural Curitiba)
   - universodograo.com.br
   - emporiopires.com.br
   - zonacerealista.com.br / estacaodosgraos.com.br
   - mercadogranel.com.br
   - emporiodaterra.com
   - MercadoLivre (filtrar por vendedores de Curitiba/PR)
   - nattuatacado.com.br

5. **Validação com o usuário:** Antes de aplicar preços em massa, apresentar uma amostra e pedir confirmação. O usuário pode ter referências locais mais precisas (ex: confirmou Damasco Turco a R$150/kg e Cacau em Pó a R$69/kg).

6. **Margem de lucro esperada:** ~40% sobre o custo. Se o preço de venda encontrado for X, o custo deve ser cadastrado como aproximadamente 0,62 × X.

7. **Nunca multiplicar preços** de uma unidade para outra sem pesquisar o valor real. Isso gera distorções graves (ex: preço por 100g × 10 ≠ preço por kg real do mercado).

---

## Regras de Cadastro de Produtos

- **Unidade:** Apenas `kg` ou `L` (litro). Nunca usar `g` ou `ml`.
- **PLU:** Todo produto deve ter PLU único e sequencial. Verificar sempre o maior PLU existente antes de inserir.
- **Preço de custo:** Sempre preencher. Usar aproximadamente 62% do preço de venda como referência.
- **Categorias disponíveis:**
  - 1 — Chás e Ervas
  - 2 — Grãos e Cereais
  - 3 — Suplementos
  - 4 — Temperos e Especiarias
  - 5 — Óleos e Vinagres
  - 6 — Cosméticos Naturais
  - 7 — Farinhas e Amidos
  - 8 — Sementes
  - 9 — Frutas Secas
  - 10 — Adoçantes Naturais

---

## Balança Toledo Prix 3 Fit

- Protocolo: EAN-13 com prefixo `2`
- Formato do código: `2` + PLU (5 dígitos) + Valor (5 dígitos) + 2 dígitos extras
- Software de importação: **MGV6** (Toledo Brasil)
- Arquivo de exportação: `ITENSMGV.txt`
- Para gerar o arquivo: botão **"Exportar Balança"** na tela de Produtos (`/produtos`)
- Endpoint: `GET /api/products/export/balanca` (requer role ADMIN)
- O PDV lê etiquetas da balança automaticamente no campo de busca do PDV

---

## Fornecedores Cadastrados

Principais fornecedores registrados no sistema:

| ID | Nome | Localização | Prazo |
|----|------|-------------|-------|
| 6 | Distribuidora Sgoda | **Colombo-PR (local)** | 1 dia |
| 4 | AKS Alimentos | Curitiba-PR | 2 dias |
| 2 | Universo do Grão | Curitiba-PR | 3 dias |
| 3 | Linha Verde Alimentos | Curitiba-PR | 3 dias |
| 5 | Destro Macro Atacado | Curitiba-PR | 3 dias |
| 8 | Nattu Atacado | E-commerce PR | 5 dias |
| 7 | Paiol Atacado | Barueri-SP | 7 dias |
| 10 | Chá e Cia | Jacareí-SP | 7 dias |

---

## Usuários do Sistema

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | admin@casagranella.com | admin123 |
| Caixa | caixa@casagranella.com | operador123 |

---

## Chave PIX

- Tipo: Telefone
- Formato obrigatório: `+55XXXXXXXXXXX` (com `+55`, sem espaços)

---

## Módulos Implementados

- Auth (JWT com refresh token)
- Produtos + Categorias + PLU
- PDV / Caixa (abertura, fechamento, venda, cancelamento)
- Clientes
- Fornecedores
- Despesas
- Dashboard e Relatórios
- Exportação para Balança (ITENSMGV.txt)

---

## Identidade Visual

- Verde: `#4a7c2f` (cor primária)
- Creme: `#f5f0e8` (fundo)
- Dourado: `#c49a3c` (acentos)
- Fonte: Plus Jakarta Sans
