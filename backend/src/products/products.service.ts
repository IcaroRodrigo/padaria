import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private productSelect = {
    id: true,
    name: true,
    description: true,
    unit: true,
    costPrice: true,
    salePrice: true,
    barcode: true,
    plu: true,
    expirationDate: true,
    active: true,
    stockQty: true,
    minStockQty: true,
    createdAt: true,
    category: { select: { id: true, name: true } },
    supplier: { select: { id: true, companyName: true, tradeName: true } },
  };

  async create(dto: CreateProductDto, empresaId: number) {
    if (dto.barcode) {
      const existing = await this.prisma.product.findUnique({
        where: { barcode: dto.barcode },
      });
      if (existing) throw new ConflictException('Código de barras já cadastrado');
    }

    if (dto.plu) {
      const existing = await this.prisma.product.findUnique({
        where: { plu: dto.plu },
        select: { name: true },
      });
      if (existing)
        throw new ConflictException(
          `PLU ${dto.plu} já está em uso pelo produto "${existing.name}"`,
        );
    }

    return this.prisma.product.create({
      data: {
        empresaId,
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        unit: dto.unit,
        costPrice: dto.costPrice,
        salePrice: dto.salePrice,
        barcode: dto.barcode || null,
        plu: dto.plu,
        supplierId: dto.supplierId || null,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        active: dto.active ?? true,
        stockQty: dto.stockQty,
        minStockQty: dto.minStockQty,
      },
      select: this.productSelect,
    });
  }

  async findAll(
    query: { search?: string; categoryId?: number; active?: boolean; expiringDays?: number },
    empresaId: number,
  ) {
    const where: any = { empresaId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { barcode: { contains: query.search } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = Number(query.categoryId);
    }

    if (query.active !== undefined) {
      where.active = query.active === true || (query.active as any) === 'true';
    }

    if (query.expiringDays) {
      const days = Number(query.expiringDays);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      where.expirationDate = {
        not: null,
        lte: futureDate,
      };
    }

    return this.prisma.product.findMany({
      where,
      select: this.productSelect,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, empresaId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, empresaId },
      select: this.productSelect,
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async findByBarcode(barcode: string, empresaId: number) {
    const product = await this.prisma.product.findFirst({
      where: { barcode, empresaId },
      select: this.productSelect,
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async findByPlu(plu: number, empresaId: number) {
    const product = await this.prisma.product.findFirst({
      where: { plu, empresaId },
      select: this.productSelect,
    });
    if (!product) throw new NotFoundException('Produto não encontrado para este PLU');
    return product;
  }

  async update(id: number, dto: Partial<CreateProductDto>, empresaId: number) {
    await this.findOne(id, empresaId);

    if (dto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: { barcode: dto.barcode, NOT: { id } },
        select: { name: true },
      });
      if (existing)
        throw new ConflictException(
          `Código de barras já cadastrado para o produto "${existing.name}"`,
        );
    }

    if (dto.plu) {
      const existing = await this.prisma.product.findFirst({
        where: { plu: dto.plu, NOT: { id } },
        select: { name: true },
      });
      if (existing)
        throw new ConflictException(
          `PLU ${dto.plu} já está em uso pelo produto "${existing.name}"`,
        );
    }

    const { supplierId, expirationDate, barcode, ...rest } = dto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        barcode: barcode === undefined ? undefined : (barcode || null),
        supplierId: supplierId || null,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      },
      select: this.productSelect,
    });
  }

  async remove(id: number, empresaId: number) {
    await this.findOne(id, empresaId);
    const hasSales = await this.prisma.saleItem.count({ where: { productId: id } });
    if (hasSales > 0) {
      throw new ConflictException('Este produto possui vendas registradas e não pode ser excluído.');
    }
    return this.prisma.product.delete({ where: { id } });
  }

  async exportBalanca(empresaId: number): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: { empresaId, active: true, plu: { not: null } },
      orderBy: { plu: 'asc' },
    });

    const removeAccents = (str: string) =>
      str.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

    const pad = (str: string, len: number) =>
      str.substring(0, len).padEnd(len, ' ');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const lines = products.map((p) => {
      const depto = '01';
      const tipo = ['kg', 'g'].includes(p.unit) ? '0' : '1';
      const plu  = String(p.plu).padStart(6, '0');
      const preco = String(Math.round(Number(p.salePrice) * 100)).padStart(6, '0');
      const d1 = pad(removeAccents(p.name), 25);
      const d2 = ' '.repeat(25);
      const d3 = ' '.repeat(35);
      const d4 = ' '.repeat(35);

      let vvv = '000';
      if (p.expirationDate) {
        const exp = new Date(p.expirationDate);
        exp.setHours(0, 0, 0, 0);
        const dias = Math.ceil((exp.getTime() - hoje.getTime()) / 86400000);
        if (dias > 0 && dias <= 990) vvv = String(dias).padStart(3, '0');
      }

      return (
        depto + tipo + plu + preco +
        vvv +
        d1 + d2 +
        '000000' +
        '0000' +
        '000000' +
        (vvv !== '000' ? '1' : '0') +
        '0' +
        '0000' +
        '000000000000' +
        '00000000000' +
        '1' +
        '0000' +
        '0000' +
        '0000' +
        '0000' +
        '0000' +
        '0000' +
        '000000000000' +
        '000000' +
        '|01|' +
        d3 + d4 +
        '000000' +
        '000000' +
        '000000' +
        '000000' +
        '0' +
        '||' +
        '0' +
        '||' +
        '000000000000' +
        '0000' +
        '000000' +
        '||' +
        '0'
      );
    });

    return lines.join('\r\n') + '\r\n';
  }

  async getNextPlu(empresaId: number): Promise<{ lastPlu: number | null; nextPlu: number }> {
    const result = await this.prisma.product.aggregate({
      where: { empresaId },
      _max: { plu: true },
    });
    const lastPlu = result._max.plu;
    return { lastPlu, nextPlu: (lastPlu ?? 0) + 1 };
  }

  async bulkImport(
    products: { name: string; plu: number; salePrice: number; unit: string; categoryName: string }[],
    empresaId: number,
  ) {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];
    const categoryCache = new Map<string, number>();

    const getOrCreateCategory = async (name: string): Promise<number> => {
      if (categoryCache.has(name)) return categoryCache.get(name)!;
      let cat = await this.prisma.category.findFirst({ where: { name, empresaId }, select: { id: true } });
      if (!cat) cat = await this.prisma.category.create({ data: { name, empresaId }, select: { id: true } });
      categoryCache.set(name, cat.id);
      return cat.id;
    };

    for (const p of products) {
      try {
        const existing = await this.prisma.product.findFirst({ where: { plu: p.plu, empresaId }, select: { id: true } });
        if (existing) { skipped++; continue; }
        const categoryId = await getOrCreateCategory(p.categoryName);
        await this.prisma.product.create({
          data: { empresaId, name: p.name, categoryId, unit: p.unit, costPrice: 0, salePrice: p.salePrice, plu: p.plu, active: true },
        });
        created++;
      } catch (e: any) {
        errors.push(`${p.name}: ${e.message}`);
      }
    }

    return { created, skipped, errors };
  }

  async getCategories(empresaId: number) {
    return this.prisma.category.findMany({
      where: { empresaId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(name: string, empresaId: number) {
    return this.prisma.category.create({ data: { name, empresaId } });
  }

  async deleteCategory(id: number, empresaId: number) {
    return this.prisma.category.delete({ where: { id, empresaId } });
  }
}
