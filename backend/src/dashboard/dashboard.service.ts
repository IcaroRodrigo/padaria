import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(period: 'day' | 'week' | 'month' | 'last3months') {
    const now = new Date();
    // Paraná = BRT (UTC-3), sem horário de verão.
    // Calcular datas sempre em BRT para garantir corte correto no Railway (UTC).
    const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;
    const nowBRT = new Date(now.getTime() - BRT_OFFSET_MS);
    const y = nowBRT.getUTCFullYear();
    const m = nowBRT.getUTCMonth();
    const d = nowBRT.getUTCDate();

    // Meia-noite BRT em UTC = UTC 03:00
    const midnightBRT = (year: number, month: number, day: number) =>
      new Date(Date.UTC(year, month, day, 3, 0, 0, 0));

    let start: Date;
    if (period === 'day') {
      start = midnightBRT(y, m, d);
    } else if (period === 'week') {
      const dayOfWeek = nowBRT.getUTCDay(); // 0=dom … 6=sab
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = midnightBRT(y, m, d - daysToMonday);
    } else if (period === 'last3months') {
      start = midnightBRT(y, m - 3, 1);
    } else {
      start = midnightBRT(y, m, 1);
    }

    return { start, end: now };
  }

  async getOverview(empresaId: number) {
    const today = this.getDateRange('day');
    const week = this.getDateRange('week');
    const month = this.getDateRange('month');
    const last3months = this.getDateRange('last3months');

    const salesWhere = (start: Date, end: Date) => ({
      empresaId,
      status: 'COMPLETED' as const,
      createdAt: { gte: start, lte: end },
    });

    const [
      todaySales,
      weekSales,
      monthSales,
      last3monthsSales,
      todaySaleItems,
      expiringProducts,
      topProducts,
      allUnitProducts,
    ] = await Promise.all([
      this.prisma.sale.aggregate({
        where: salesWhere(today.start, today.end),
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      this.prisma.sale.aggregate({
        where: salesWhere(week.start, week.end),
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      this.prisma.sale.aggregate({
        where: salesWhere(month.start, month.end),
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      this.prisma.sale.aggregate({
        where: salesWhere(last3months.start, last3months.end),
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      this.prisma.saleItem.findMany({
        where: { sale: salesWhere(today.start, today.end) },
        select: {
          quantity: true,
          subtotal: true,
          product: { select: { costPrice: true } },
        },
      }),
      this.prisma.product.findMany({
        where: {
          empresaId,
          active: true,
          expirationDate: {
            not: null,
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { id: true, name: true, expirationDate: true, stockQty: true },
        orderBy: { expirationDate: 'asc' },
        take: 10,
      }),
      this.prisma.saleItem.groupBy({
        by: ['productId'],
        where: {
          sale: salesWhere(month.start, month.end),
        },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.product.findMany({
        where: {
          empresaId,
          active: true,
          unit: { notIn: ['kg', 'L'] },
          stockQty: { not: null },
        },
        select: { id: true, name: true, unit: true, stockQty: true, minStockQty: true },
      }),
    ]);

    const lowStockProducts = allUnitProducts
      .filter((p) => {
        const qty = Number(p.stockQty ?? 0);
        const min = Number(p.minStockQty ?? 5);
        return qty <= min;
      })
      .sort((a, b) => Number(a.stockQty) - Number(b.stockQty));

    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, unit: true },
        });
        return {
          productId: item.productId,
          name: product?.name,
          unit: product?.unit,
          quantity: item._sum.quantity,
          revenue: item._sum.subtotal,
        };
      }),
    );

    const todayRevenue = Number(todaySales._sum.finalAmount || 0);
    const todayCount = todaySales._count.id;
    const weekRevenue = Number(weekSales._sum.finalAmount || 0);
    const monthRevenue = Number(monthSales._sum.finalAmount || 0);
    const monthCount = monthSales._count.id;

    const todayCost = todaySaleItems.reduce((sum, item) => {
      return sum + Number(item.quantity) * Number(item.product.costPrice);
    }, 0);
    const todayProfit = todayRevenue - todayCost;
    const todayMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;

    return {
      today: {
        revenue: todayRevenue,
        salesCount: todayCount,
        avgTicket: todayCount > 0 ? todayRevenue / todayCount : 0,
        profit: todayProfit,
        margin: todayMargin,
      },
      week: {
        revenue: weekRevenue,
        salesCount: weekSales._count.id,
        avgTicket: weekSales._count.id > 0 ? weekRevenue / weekSales._count.id : 0,
      },
      month: {
        revenue: monthRevenue,
        salesCount: monthCount,
        avgTicket: monthCount > 0 ? monthRevenue / monthCount : 0,
      },
      last3months: {
        revenue: Number(last3monthsSales._sum.finalAmount || 0),
        salesCount: last3monthsSales._count.id,
        avgTicket: last3monthsSales._count.id > 0
          ? Number(last3monthsSales._sum.finalAmount || 0) / last3monthsSales._count.id
          : 0,
      },
      expiringProducts,
      lowStockProducts,
      topProducts: topProductsWithNames,
    };
  }

  async getRevenueByPeriod(
    empresaId: number,
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'month',
  ) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');

    const sales = await this.prisma.sale.findMany({
      where: {
        empresaId,
        status: 'COMPLETED',
        createdAt: { gte: start, lte: end },
      },
      select: { finalAmount: true, createdAt: true, paymentMethod: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day or month
    const grouped: Record<string, { revenue: number; count: number }> = {};

    for (const sale of sales) {
      let key: string;
      if (groupBy === 'day') {
        key = sale.createdAt.toISOString().split('T')[0];
      } else {
        key = `${sale.createdAt.getFullYear()}-${String(sale.createdAt.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 };
      grouped[key].revenue += Number(sale.finalAmount);
      grouped[key].count += 1;
    }

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
  }

  async getRevenueByPaymentMethod(empresaId: number, startDate: string, endDate: string) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');

    const result = await this.prisma.salePayment.groupBy({
      by: ['method'],
      where: {
        sale: {
          empresaId,
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end },
        },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    return result.map((r) => ({
      method: r.method,
      amount: Number(r._sum.amount || 0),
      count: r._count.id,
    }));
  }

  async getTopProducts(empresaId: number, startDate: string, endDate: string, limit = 10) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');

    const items = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          empresaId,
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end },
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return Promise.all(
      items.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, unit: true, category: { select: { name: true } } },
        });
        return {
          productId: item.productId,
          name: product?.name,
          unit: product?.unit,
          category: product?.category?.name,
          quantity: Number(item._sum.quantity || 0),
          revenue: Number(item._sum.subtotal || 0),
        };
      }),
    );
  }

  async getCashFlow(empresaId: number, startDate: string, endDate: string) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');

    const [salesResult, expensesResult, saleItems] = await Promise.all([
      this.prisma.sale.aggregate({
        where: { empresaId, status: 'COMPLETED', createdAt: { gte: start, lte: end } },
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      this.prisma.expense.groupBy({
        by: ['type'],
        where: { empresaId, dueDate: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      this.prisma.saleItem.findMany({
        where: { sale: { empresaId, status: 'COMPLETED', createdAt: { gte: start, lte: end } } },
        select: { quantity: true, product: { select: { costPrice: true } } },
      }),
    ]);

    const revenue = Number(salesResult._sum.finalAmount || 0);
    const cmv = saleItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.product.costPrice),
      0,
    );
    const expensesByType = expensesResult.reduce(
      (acc, e) => { acc[e.type] = Number(e._sum.amount || 0); return acc; },
      {} as Record<string, number>,
    );
    const totalExpenses = (expensesByType.FIXED || 0) + (expensesByType.VARIABLE || 0);

    return {
      revenue,
      salesCount: salesResult._count.id,
      cmv,
      expenses: {
        total: totalExpenses,
        fixed: expensesByType.FIXED || 0,
        variable: expensesByType.VARIABLE || 0,
      },
      profit: revenue - cmv - totalExpenses,
    };
  }

  async getProfitByPeriod(
    empresaId: number,
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'month',
  ) {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');

    const [saleItems, expenses] = await Promise.all([
      this.prisma.saleItem.findMany({
        where: { sale: { empresaId, status: 'COMPLETED', createdAt: { gte: start, lte: end } } },
        select: {
          quantity: true,
          subtotal: true,
          sale: { select: { createdAt: true } },
          product: { select: { costPrice: true } },
        },
      }),
      this.prisma.expense.findMany({
        where: { empresaId, dueDate: { gte: start, lte: end } },
        select: { amount: true, dueDate: true },
      }),
    ]);

    const key = (date: Date) =>
      groupBy === 'day'
        ? date.toISOString().split('T')[0]
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const grouped: Record<string, { revenue: number; cmv: number; expenses: number }> = {};

    for (const item of saleItems) {
      const k = key(item.sale.createdAt);
      if (!grouped[k]) grouped[k] = { revenue: 0, cmv: 0, expenses: 0 };
      grouped[k].revenue += Number(item.subtotal);
      grouped[k].cmv += Number(item.quantity) * Number(item.product.costPrice);
    }

    for (const expense of expenses) {
      if (!expense.dueDate) continue;
      const k = key(expense.dueDate);
      if (!grouped[k]) grouped[k] = { revenue: 0, cmv: 0, expenses: 0 };
      grouped[k].expenses += Number(expense.amount);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        revenue: d.revenue,
        cmv: d.cmv,
        expenses: d.expenses,
        profit: d.revenue - d.cmv - d.expenses,
      }));
  }
}
