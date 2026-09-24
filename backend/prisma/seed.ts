import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Populando banco de dados...');

  const empresa = await prisma.empresa.upsert({
    where: { email: 'admin@panificadora.com' },
    update: {},
    create: {
      nome: 'Minha Panificadora',
      email: 'admin@panificadora.com',
      trialExpiraEm: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const empresaId = empresa.id;

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@panificadora.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@panificadora.com',
      password: adminPassword,
      role: 'ADMIN',
      empresaId,
    },
  });

  const operatorPassword = await bcrypt.hash('Caixa@123', 10);
  await prisma.user.upsert({
    where: { email: 'caixa@panificadora.com' },
    update: {},
    create: {
      name: 'Operador de Caixa',
      email: 'caixa@panificadora.com',
      password: operatorPassword,
      role: 'OPERATOR',
      empresaId,
    },
  });

  const categories = [
    'Pães',
    'Bolos e Tortas',
    'Salgados',
    'Doces e Confeitaria',
    'Bebidas',
    'Frios e Laticínios',
    'Embutidos',
    'Produtos Naturais',
    'Biscoitos e Snacks',
    'Outros',
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { id: categories.indexOf(name) + 1 },
      update: { name },
      create: { name, empresaId },
    });
  }

  const expenseCategories = [
    'Aluguel',
    'Energia Elétrica',
    'Internet e Telefone',
    'Salários',
    'Matéria-Prima',
    'Embalagens',
    'Manutenção de Equipamentos',
    'Marketing',
    'Frete',
    'Outros',
  ];

  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { id: expenseCategories.indexOf(name) + 1 },
      update: { name },
      create: { name, empresaId },
    });
  }

  console.log('✅ Banco populado com sucesso!');
  console.log('📧 Admin: admin@panificadora.com | Senha: Admin@123');
  console.log('📧 Caixa: caixa@panificadora.com | Senha: Caixa@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
