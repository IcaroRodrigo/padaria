import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSaleDto,
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CancelSaleDto,
  CorrectSaleItemDto,
} from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  private saleSelect = {
    id: true,
    totalAmount: true,
    discount: true,
    finalAmount: true,
    paymentMethod: true,
    amountPaid: true,
    change: true,
    status: true,
    cancelReason: true,
    createdAt: true,
    customer: { select: { id: true, name: true, cpf: true } },
    user: { select: { id: true, name: true } },
    cashRegister: { select: { id: true, openedAt: true } },
    items: {
      include: {
        product: { select: { id: true, name: true, unit: true } },
      },
    },
    payments: true,
  };

  // Cash Register
  async openCashRegister(userId: number, empresaId: number, dto: OpenCashRegisterDto) {
    const openRegister = await this.prisma.cashRegister.findFirst({
      where: { userId, empresaId, closedAt: null },
    });
    if (openRegister) {
      throw new BadRequestException('Já existe um caixa aberto para este operador');
    }

    return this.prisma.cashRegister.create({
      data: {
        userId,
        empresaId,
        openingBalance: dto.openingBalance,
      },
    });
  }

  async closeCashRegister(
    userId: number,
    empresaId: number,
    registerId: number,
    dto: CloseCashRegisterDto,
  ) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { id: registerId, userId, empresaId, closedAt: null },
    });
    if (!register) {
      throw new NotFoundException('Caixa não encontrado ou já fechado');
    }

    return this.prisma.cashRegister.update({
      where: { id: registerId },
      data: {
        closedAt: new Date(),
        closingBalance: dto.closingBalance,
      },
    });
  }

  async getOpenCashRegister(userId: number, empresaId: number) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { userId, empresaId, closedAt: null },
      include: {
        sales: {
          where: { status: 'COMPLETED' },
          select: { finalAmount: true, paymentMethod: true, payments: { select: { method: true, amount: true } } },
        },
      },
    });
    if (!register) return null;

    const totalSales = register.sales.reduce(
      (sum, s) => sum + Number(s.finalAmount),
      0,
    );

    // Breakdown por forma de pagamento
    const byMethod: Record<string, number> = { CASH: 0, PIX: 0, DEBIT: 0, CREDIT: 0, MIXED: 0 };
    for (const sale of register.sales) {
      for (const payment of sale.payments) {
        byMethod[payment.method] = (byMethod[payment.method] || 0) + Number(payment.amount);
      }
    }

    return {
      ...register,
      totalSales,
      salesCount: register.sales.length,
      byMethod,
    };
  }


  // Sales
  async create(userId: number, empresaId: number, dto: CreateSaleDto) {
    const totalAmount = dto.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice - (item.discount || 0);
      return sum + itemSubtotal;
    }, 0);

    const discount = dto.discount || 0;
    const finalAmount = totalAmount - discount;

    const paymentTotal = dto.payments.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(paymentTotal - finalAmount) > 0.01) {
      throw new BadRequestException(
        `Total dos pagamentos (R$ ${paymentTotal.toFixed(2)}) não corresponde ao valor da venda (R$ ${finalAmount.toFixed(2)})`,
      );
    }

    const paymentMethods = [...new Set(dto.payments.map((p) => p.method))];
    const paymentMethod =
      paymentMethods.length === 1 ? paymentMethods[0] : 'MIXED';

    const cashPayment = dto.payments.find((p) => p.method === 'CASH');
    const amountPaid = cashPayment ? cashPayment.amount : undefined;
    const change =
      cashPayment && amountPaid && amountPaid > finalAmount
        ? amountPaid - finalAmount
        : 0;

    // Valida e decrementa estoque de todos os produtos com stockQty definido
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, empresaId },
      select: { id: true, name: true, unit: true, stockQty: true },
    });

    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || product.stockQty === null) continue;
      const estoque = Number(product.stockQty);
      if (estoque < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para "${product.name}": disponível ${estoque} ${product.unit}, solicitado ${item.quantity} ${product.unit}`,
        );
      }
    }

    const sale = await this.prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          empresaId,
          customerId: dto.customerId,
          userId,
          cashRegisterId: dto.cashRegisterId,
          totalAmount,
          discount,
          finalAmount,
          paymentMethod,
          amountPaid,
          change,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              subtotal: item.quantity * item.unitPrice - (item.discount || 0),
            })),
          },
          payments: {
            create: dto.payments.map((p) => ({
              method: p.method,
              amount: p.amount,
            })),
          },
        },
        select: this.saleSelect,
      });

      for (const item of dto.items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product || product.stockQty === null) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }

      return created;
    }, { timeout: 30000, maxWait: 30000 });

    return sale;
  }

  async findAll(
    empresaId: number,
    query: {
      startDate?: string;
      endDate?: string;
      paymentMethod?: string;
      userId?: number;
      cashRegisterId?: number;
      status?: string;
      page?: number;
      limit?: number;
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

    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
    if (query.userId) where.userId = Number(query.userId);
    if (query.cashRegisterId) where.cashRegisterId = Number(query.cashRegisterId);
    if (query.status) where.status = query.status;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        select: this.saleSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return { sales, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(empresaId: number, id: number) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, empresaId },
      select: this.saleSelect,
    });
    if (!sale) throw new NotFoundException('Venda não encontrada');
    return sale;
  }

  async cancel(empresaId: number, id: number, dto: CancelSaleDto) {
    const sale = await this.findOne(empresaId, id);
    if (sale.status === 'CANCELLED') {
      throw new BadRequestException('Venda já cancelada');
    }

    return this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.sale.update({
        where: { id },
        data: { status: 'CANCELLED', cancelReason: dto.reason },
        select: this.saleSelect,
      });

      for (const item of sale.items) {
        await tx.product.updateMany({
          where: { id: item.product.id, stockQty: { not: null } },
          data: { stockQty: { increment: item.quantity } },
        });
      }

      return cancelled;
    });
  }

  async correctItem(empresaId: number, saleId: number, dto: CorrectSaleItemDto) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, empresaId },
      include: { items: true, payments: true },
    });
    if (!sale) throw new NotFoundException('Venda não encontrada');
    if (sale.status === 'CANCELLED') throw new BadRequestException('Venda cancelada não pode ser corrigida');

    const item = sale.items.find(i => i.id === dto.saleItemId);
    if (!item) throw new NotFoundException('Item não encontrado nesta venda');

    const novoSubtotal = dto.quantity * dto.unitPrice;
    const subtotalAntigo = Number(item.subtotal);
    const novoTotal = Number(sale.totalAmount) - subtotalAntigo + novoSubtotal;
    const novoFinal = novoTotal - Number(sale.discount);

    return this.prisma.$transaction(async (tx) => {
      await tx.saleItem.update({
        where: { id: dto.saleItemId },
        data: { quantity: dto.quantity, unitPrice: dto.unitPrice, subtotal: novoSubtotal },
      });

      await tx.sale.update({
        where: { id: saleId },
        data: { totalAmount: novoTotal, finalAmount: novoFinal },
      });

      // Distribui o novo total proporcionalmente entre os pagamentos
      const totalPagamentos = sale.payments.reduce((s, p) => s + Number(p.amount), 0);
      for (const payment of sale.payments) {
        const proporcao = totalPagamentos > 0 ? Number(payment.amount) / totalPagamentos : 1 / sale.payments.length;
        await tx.salePayment.update({
          where: { id: payment.id },
          data: { amount: Math.round(novoFinal * proporcao * 100) / 100 },
        });
      }

      return { saleId, novoTotal: novoFinal, saleItemId: dto.saleItemId, novaQuantidade: dto.quantity, novoPreco: dto.unitPrice };
    });
  }

  async getCashRegisterHistory(empresaId: number, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate + 'T00:00:00') : undefined;
    const end = endDate ? new Date(endDate + 'T23:59:59.999') : undefined;

    const registers = await this.prisma.cashRegister.findMany({
      where: {
        empresaId,
        openedAt: {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        sales: {
          where: { status: 'COMPLETED' },
          select: {
            finalAmount: true,
            payments: { select: { method: true, amount: true } },
          },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    return registers.map((r) => {
      const totalSales = r.sales.reduce((s, sale) => s + Number(sale.finalAmount), 0);
      const byMethod: Record<string, number> = {};
      for (const sale of r.sales) {
        for (const p of sale.payments) {
          byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount);
        }
      }
      const cashIn = byMethod['CASH'] || 0;
      const expectedClosing = Number(r.openingBalance) + cashIn;
      const difference = r.closingBalance !== null && r.closingBalance !== undefined
        ? Number(r.closingBalance) - expectedClosing
        : null;

      return {
        id: r.id,
        openedAt: r.openedAt,
        closedAt: r.closedAt,
        operator: r.user.name,
        openingBalance: Number(r.openingBalance),
        closingBalance: r.closingBalance !== null ? Number(r.closingBalance) : null,
        totalSales,
        salesCount: r.sales.length,
        cashIn,
        byMethod,
        expectedClosing,
        difference,
      };
    });
  }

  async getCashRegisterProducts(empresaId: number, cashRegisterId: number) {
    // Verifica que o caixa pertence à empresa
    const register = await this.prisma.cashRegister.findFirst({
      where: { id: cashRegisterId, empresaId },
    });
    if (!register) throw new NotFoundException('Caixa não encontrado');

    const items = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          cashRegisterId,
          empresaId,
          status: 'COMPLETED',
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
    });

    return Promise.all(
      items.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, unit: true, category: { select: { name: true } } },
        });
        return {
          productId: item.productId,
          name: product?.name ?? 'Produto removido',
          unit: product?.unit ?? '',
          category: product?.category?.name ?? '',
          quantity: Number(item._sum.quantity || 0),
          revenue: Number(item._sum.subtotal || 0),
        };
      }),
    );
  }
}
