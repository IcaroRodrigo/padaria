import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: number, dto: CreateCustomerDto) {
    if (dto.cpf) {
      const existing = await this.prisma.customer.findFirst({
        where: { cpf: dto.cpf, empresaId },
      });
      if (existing) throw new ConflictException('CPF já cadastrado');
    }
    return this.prisma.customer.create({ data: { ...dto, empresaId } });
  }

  async findAll(empresaId: number, search?: string) {
    const where: any = { empresaId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { cpf: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(empresaId: number, id: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, empresaId },
      include: {
        sales: {
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          include: {
            items: { include: { product: { select: { name: true } } } },
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Cliente não encontrado');

    const totalSpent = customer.sales.reduce(
      (sum, sale) => sum + Number(sale.finalAmount),
      0,
    );
    const avgTicket = customer.sales.length > 0 ? totalSpent / customer.sales.length : 0;

    return { ...customer, totalSpent, avgTicket, totalSales: customer.sales.length };
  }

  async update(empresaId: number, id: number, dto: Partial<CreateCustomerDto>) {
    await this.findOne(empresaId, id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  async remove(empresaId: number, id: number) {
    await this.findOne(empresaId, id);
    return this.prisma.customer.delete({ where: { id } });
  }
}
