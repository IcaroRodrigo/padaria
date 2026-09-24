import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseStatus } from '@prisma/client';

@Injectable()
export class ExpensesService implements OnModuleInit {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.generateRecurringExpenses();
  }

  async generateRecurringExpenses(): Promise<number> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    const templates = await this.prisma.expense.findMany({
      where: { recurrenceDay: { not: null }, generatedFromId: null },
    });

    let created = 0;
    for (const template of templates) {
      const day = template.recurrenceDay!;

      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      // Se o próprio template tem vencimento no mês atual, ele já representa este mês
      if (template.dueDate) {
        const td = new Date(template.dueDate);
        if (td.getFullYear() === year && td.getMonth() === month) continue;
      }

      // Já existe cópia gerada para este mês?
      const existing = await this.prisma.expense.findFirst({
        where: {
          generatedFromId: template.id,
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      if (existing) continue;

      // Calcula o dia de vencimento (respeitando o último dia do mês)
      const lastDay = new Date(year, month + 1, 0).getDate();
      const dueDate = new Date(year, month, Math.min(day, lastDay));

      await this.prisma.expense.create({
        data: {
          empresaId: template.empresaId,
          description: template.description,
          amount: template.amount,
          categoryId: template.categoryId,
          type: template.type,
          status: 'PENDING',
          dueDate,
          notes: template.notes,
          recurrenceDay: null,
          generatedFromId: template.id,
        },
      });
      created++;
      this.logger.log(`Gerada recorrente: ${template.description} - ${dueDate.toLocaleDateString('pt-BR')}`);
    }

    if (created > 0) this.logger.log(`${created} despesa(s) recorrente(s) gerada(s) para ${month + 1}/${year}`);
    return created;
  }

  async create(empresaId: number, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        empresaId,
        description: dto.description,
        amount: dto.amount,
        categoryId: dto.categoryId,
        type: dto.type,
        status: dto.status || 'PENDING',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : null,
        notes: dto.notes,
        recurrenceDay: dto.recurrenceDay ?? null,
      },
      include: { category: true },
    });
  }

  async findAll(
    empresaId: number,
    query: {
      startDate?: string;
      endDate?: string;
      type?: string;
      status?: string;
      categoryId?: number;
    },
  ) {
    const where: any = { empresaId };

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = Number(query.categoryId);

    return this.prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(empresaId: number, id: number) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, empresaId },
      include: { category: true },
    });
    if (!expense) throw new NotFoundException('Despesa não encontrada');
    return expense;
  }

  async update(empresaId: number, id: number, dto: Partial<CreateExpenseDto>) {
    await this.findOne(empresaId, id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
        recurrenceDay: dto.recurrenceDay !== undefined ? (dto.recurrenceDay ?? null) : undefined,
      },
      include: { category: true },
    });
  }

  async markAsPaid(empresaId: number, id: number) {
    await this.findOne(empresaId, id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.PAID,
        paidAt: new Date(),
      },
      include: { category: true },
    });
  }

  async remove(empresaId: number, id: number) {
    await this.findOne(empresaId, id);
    return this.prisma.expense.delete({ where: { id } });
  }

  // Categories
  async getCategories(empresaId: number) {
    return this.prisma.expenseCategory.findMany({
      where: { empresaId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(empresaId: number, name: string) {
    return this.prisma.expenseCategory.create({ data: { name, empresaId } });
  }

  async deleteCategory(empresaId: number, id: number) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, empresaId },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return this.prisma.expenseCategory.delete({ where: { id } });
  }
}
