import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { EmpresaService } from './empresa.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// ─── ROTAS SUPER_ADMIN (/admin/empresas) ─────────────────────────────────────

@Controller('admin/empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminEmpresaController {
  constructor(private empresaService: EmpresaService) {}

  @Get()
  findAll() {
    return this.empresaService.findAll();
  }

  @Get('solicitacoes')
  getSolicitacoes() {
    return this.empresaService.getSolicitacoesPendentes();
  }

  @Get('config')
  getConfig() {
    return this.empresaService.getSystemConfig();
  }

  @Patch('config')
  setConfig(@Body() data: Record<string, string>) {
    return this.empresaService.setSystemConfig(data);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() data: { nome: string; email: string; cnpj?: string; telefone?: string }) {
    return this.empresaService.create(data);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.empresaService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('ativo') ativo: boolean) {
    return this.empresaService.updateStatus(id, ativo);
  }

  @Post('solicitacoes/:id/aprovar')
  @HttpCode(HttpStatus.OK)
  aprovar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.empresaService.aprovarAssinatura(id, user.id);
  }

  @Post('solicitacoes/:id/rejeitar')
  @HttpCode(HttpStatus.OK)
  rejeitar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.empresaService.rejeitarAssinatura(id, user.id);
  }
}

// ─── ROTAS DO ADMIN DA EMPRESA (/empresa) ─────────────────────────────────────

@Controller('empresa')
@UseGuards(JwtAuthGuard)
export class EmpresaController {
  constructor(private empresaService: EmpresaService) {}

  @Get('status')
  getStatus(@CurrentUser() user: any) {
    if (!user.empresaId) return { status: 'SUPER_ADMIN' };
    return this.empresaService.getStatusEmpresa(user.empresaId);
  }

  @Get('assinatura-info')
  getAssinaturaInfo() {
    return this.empresaService.getAssinaturaInfo();
  }

  @Post('assinar')
  @HttpCode(HttpStatus.CREATED)
  solicitarAssinatura(
    @CurrentUser() user: any,
    @Body('comprovanteUrl') comprovanteUrl?: string,
    @Body('valorPago') valorPago?: number,
  ) {
    return this.empresaService.criarSolicitacao(user.empresaId, comprovanteUrl, valorPago);
  }
}
