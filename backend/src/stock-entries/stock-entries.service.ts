import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockEntryDto } from './dto/create-stock-entry.dto';

@Injectable()
export class StockEntriesService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: number, dto: CreateStockEntryDto) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, empresaId },
      select: { id: true, name: true },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const totalCost = Number(dto.quantity) * Number(dto.unitCost);

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.stockEntry.create({
        data: {
          empresaId,
          productId: dto.productId,
          quantity: dto.quantity,
          unitCost: dto.unitCost,
          totalCost,
          supplierId: dto.supplierId || null,
          notes: dto.notes,
        },
        include: {
          product: { select: { id: true, name: true, unit: true } },
          supplier: { select: { id: true, companyName: true } },
        },
      });

      await tx.product.update({
        where: { id: dto.productId },
        data: { stockQty: { increment: dto.quantity } },
      });

      return entry;
    });
  }

  async findAll(
    empresaId: number,
    query: {
      startDate?: string;
      endDate?: string;
      productId?: number;
      supplierId?: number;
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

    if (query.productId) where.productId = Number(query.productId);
    if (query.supplierId) where.supplierId = Number(query.supplierId);

    const entries = await this.prisma.stockEntry.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: { select: { name: true } },
          },
        },
        supplier: { select: { id: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCost = entries.reduce((sum, e) => sum + Number(e.totalCost), 0);

    return { entries, totalCost, count: entries.length };
  }

  async remove(empresaId: number, id: number) {
    const entry = await this.prisma.stockEntry.findFirst({
      where: { id, empresaId },
      select: { productId: true, quantity: true },
    });
    if (!entry) throw new NotFoundException('Entrada não encontrada');

    return this.prisma.$transaction(async (tx) => {
      await tx.stockEntry.delete({ where: { id } });
      await tx.product.update({
        where: { id: entry.productId },
        data: { stockQty: { decrement: entry.quantity } },
      });
    });
  }
}
