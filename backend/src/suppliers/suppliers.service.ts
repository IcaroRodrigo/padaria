import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: number, dto: CreateSupplierDto) {
    if (dto.cnpj) {
      const existing = await this.prisma.supplier.findFirst({
        where: { cnpj: dto.cnpj, empresaId },
      });
      if (existing) throw new ConflictException('CNPJ já cadastrado');
    }
    return this.prisma.supplier.create({ data: { ...dto, empresaId } });
  }

  async findAll(empresaId: number, search?: string) {
    const where: any = { empresaId };
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { tradeName: { contains: search } },
        { cnpj: { contains: search } },
      ];
    }
    return this.prisma.supplier.findMany({
      where,
      orderBy: { companyName: 'asc' },
    });
  }

  async findOne(empresaId: number, id: number) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, empresaId },
      include: {
        products: {
          select: { id: true, name: true, unit: true, salePrice: true, active: true },
        },
      },
    });
    if (!supplier) throw new NotFoundException('Fornecedor não encontrado');
    return supplier;
  }

  async update(empresaId: number, id: number, dto: Partial<CreateSupplierDto>) {
    await this.findOne(empresaId, id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(empresaId: number, id: number) {
    await this.findOne(empresaId, id);
    return this.prisma.supplier.delete({ where: { id } });
  }
}
