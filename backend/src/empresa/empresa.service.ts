import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SYSTEM_CONFIG_DEFAULTS: Record<string, string> = {
  saas_pix_key:  '',
  saas_whatsapp: '',
  saas_valor:    '89',
  saas_pix_name: 'GRANELSYSTEM',
  saas_pix_city: 'CURITIBA',
};

@Injectable()
export class EmpresaService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const empresas = await this.prisma.empresa.findMany({
      orderBy: { criadaEm: 'desc' },
      include: { _count: { select: { users: true } } },
    });

    return empresas.map((e) => ({
      ...e,
      status: this.calcStatus(e),
      diasRestantes: this.calcDiasRestantes(e),
    }));
  }

  async findOne(id: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, email: true, role: true, active: true } },
        solicitacoes: { orderBy: { criadoEm: 'desc' }, take: 5 },
        _count: { select: { sales: true, products: true } },
      },
    });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');
    return { ...empresa, status: this.calcStatus(empresa), diasRestantes: this.calcDiasRestantes(empresa) };
  }

  async create(data: { nome: string; email: string; cnpj?: string; telefone?: string }) {
    const existing = await this.prisma.empresa.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('E-mail já cadastrado');

    const trialExpiraEm = new Date();
    trialExpiraEm.setDate(trialExpiraEm.getDate() + 15);

    return this.prisma.empresa.create({ data: { ...data, trialExpiraEm } });
  }

  async updateStatus(id: number, ativo: boolean) {
    await this.findOne(id);
    return this.prisma.empresa.update({ where: { id }, data: { ativo } });
  }

  async aprovarAssinatura(solicitacaoId: number, adminId: number) {
    const sol = await this.prisma.solicitacaoAssinatura.findUnique({
      where: { id: solicitacaoId },
    });
    if (!sol) throw new NotFoundException('Solicitação não encontrada');
    if (sol.status !== 'PENDENTE') throw new BadRequestException('Solicitação já processada');

    const assinaturaExpiraEm = new Date();
    assinaturaExpiraEm.setDate(assinaturaExpiraEm.getDate() + 30);

    await this.prisma.$transaction([
      this.prisma.solicitacaoAssinatura.update({
        where: { id: solicitacaoId },
        data: { status: 'APROVADO', processadoEm: new Date(), processadoPor: adminId },
      }),
      this.prisma.empresa.update({
        where: { id: sol.empresaId },
        data: { assinaturaExpiraEm, ativo: true },
      }),
    ]);

    return { message: 'Assinatura aprovada — acesso estendido por 30 dias' };
  }

  async rejeitarAssinatura(solicitacaoId: number, adminId: number) {
    const sol = await this.prisma.solicitacaoAssinatura.findUnique({
      where: { id: solicitacaoId },
    });
    if (!sol) throw new NotFoundException('Solicitação não encontrada');
    if (sol.status !== 'PENDENTE') throw new BadRequestException('Solicitação já processada');

    await this.prisma.solicitacaoAssinatura.update({
      where: { id: solicitacaoId },
      data: { status: 'REJEITADO', processadoEm: new Date(), processadoPor: adminId },
    });

    return { message: 'Solicitação rejeitada' };
  }

  async getSolicitacoesPendentes() {
    return this.prisma.solicitacaoAssinatura.findMany({
      where: { status: 'PENDENTE' },
      include: { empresa: { select: { id: true, nome: true, email: true } } },
      orderBy: { criadoEm: 'asc' },
    });
  }

  async criarSolicitacao(empresaId: number, comprovanteUrl?: string, valorPago?: number) {
    const pendente = await this.prisma.solicitacaoAssinatura.findFirst({
      where: { empresaId, status: 'PENDENTE' },
    });
    if (pendente) throw new BadRequestException('Já existe uma solicitação pendente para esta empresa');

    return this.prisma.solicitacaoAssinatura.create({
      data: { empresaId, comprovanteUrl, valorPago, status: 'PENDENTE' },
    });
  }

  async getStatusEmpresa(empresaId: number) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { ativo: true, trialExpiraEm: true, assinaturaExpiraEm: true, nome: true },
    });
    if (!empresa) throw new NotFoundException('Empresa não encontrada');

    return {
      nome: empresa.nome,
      ativo: empresa.ativo,
      status: this.calcStatus(empresa),
      diasRestantes: this.calcDiasRestantes(empresa),
    };
  }

  async getSystemConfig(): Promise<Record<string, string>> {
    const rows = await this.prisma.systemConfig.findMany();
    const result = { ...SYSTEM_CONFIG_DEFAULTS };
    for (const row of rows) result[row.key] = row.value;
    return result;
  }

  async setSystemConfig(data: Record<string, string>): Promise<Record<string, string>> {
    const allowed = Object.keys(SYSTEM_CONFIG_DEFAULTS);
    for (const [key, value] of Object.entries(data)) {
      if (!allowed.includes(key)) continue;
      await this.prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }
    return this.getSystemConfig();
  }

  async getAssinaturaInfo() {
    const cfg = await this.getSystemConfig();
    return {
      pixKey:  cfg.saas_pix_key,
      whatsapp: cfg.saas_whatsapp,
      valor:   Number(cfg.saas_valor) || 89,
      pixName: cfg.saas_pix_name,
      pixCity: cfg.saas_pix_city,
    };
  }

  private calcStatus(e: { ativo: boolean; trialExpiraEm: Date; assinaturaExpiraEm: Date | null }) {
    if (!e.ativo) return 'BLOQUEADA';
    const agora = new Date();
    if (e.assinaturaExpiraEm && e.assinaturaExpiraEm > agora) return 'ATIVA';
    if (e.trialExpiraEm > agora) return 'TRIAL';
    return 'EXPIRADA';
  }

  private calcDiasRestantes(e: { trialExpiraEm: Date; assinaturaExpiraEm: Date | null }) {
    const agora = new Date();
    const ref = e.assinaturaExpiraEm && e.assinaturaExpiraEm > agora
      ? e.assinaturaExpiraEm
      : e.trialExpiraEm;
    return Math.max(0, Math.ceil((ref.getTime() - agora.getTime()) / 86400000));
  }
}
