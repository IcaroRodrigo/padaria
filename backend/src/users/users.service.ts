import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(empresaId: number, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        empresaId,
      },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });

    return user;
  }

  async findAll(empresaId: number) {
    return this.prisma.user.findMany({
      where: { empresaId },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(empresaId: number, id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, empresaId },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async update(empresaId: number, id: number, data: Partial<CreateUserDto>) {
    await this.findOne(empresaId, id);
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
  }

  async toggleActive(empresaId: number, id: number) {
    const user = await this.findOne(empresaId, id);
    return this.prisma.user.update({
      where: { id },
      data: { active: !user.active },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
  }
}
