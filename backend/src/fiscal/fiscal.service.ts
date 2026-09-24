import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const PAYMENT_METHOD_MAP: Record<string, string> = {
  CASH: '01',
  PIX: '17',
  DEBIT: '04',
  CREDIT: '03',
};

@Injectable()
export class FiscalService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  async emitir(saleId: number, empresaId: number, cpfDestinatario?: string) {
    const existing = await this.prisma.fiscalNote.findUnique({ where: { saleId } });
    if (existing?.status === 'AUTHORIZED') {
      throw new BadRequestException('Nota fiscal já autorizada para esta venda');
    }

    const cfg = await this.settings.getAll(empresaId);
    const token = cfg.focusnfe_token;
    if (!token) throw new BadRequestException('Token FocusNFE não configurado em Configurações > Fiscal');

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, empresaId },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
      },
    });
    if (!sale) throw new NotFoundException('Venda não encontrada');
    if (sale.status === 'CANCELLED') {
      throw new BadRequestException('Não é possível emitir NFC-e para venda cancelada');
    }

    const ambiente = cfg.focusnfe_ambiente || 'homologacao';
    const ref = `nfce-${saleId}-${Date.now()}`;

    const note = await this.prisma.fiscalNote.upsert({
      where: { saleId },
      create: { saleId, ref, cpfDestinatario, status: $Enums.FiscalNoteStatus.PROCESSING, ambiente },
      update: { ref, cpfDestinatario, status: $Enums.FiscalNoteStatus.PROCESSING, ambiente, errorMessage: null },
    });

    const payload = this.buildPayload(sale, cfg, cpfDestinatario, ambiente);

    const baseUrl =
      ambiente === 'producao'
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br';

    try {
      const res = await fetch(`${baseUrl}/v2/nfce?ref=${ref}&completa=1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as any;

      if (res.status === 200 || res.status === 201) {
        const updated = await this.applyFocusResponse(note.id, data, ambiente);
        if (updated.status === 'AUTHORIZED') {
          const emailContador = await this.settings.get('email_contador', empresaId);
          this.sendXmlToAccountant(updated, emailContador, empresaId);
        }
        return updated;
      }

      const errosDetail = Array.isArray(data?.erros)
        ? data.erros.map((e: any) => e.mensagem).join('; ')
        : null;
      const errMsg = errosDetail || data?.mensagem || `HTTP ${res.status}`;

      return this.prisma.fiscalNote.update({
        where: { id: note.id },
        data: { status: $Enums.FiscalNoteStatus.ERROR, errorMessage: errMsg },
      });
    } catch (err: any) {
      return this.prisma.fiscalNote.update({
        where: { id: note.id },
        data: { status: $Enums.FiscalNoteStatus.ERROR, errorMessage: err?.message ?? String(err) },
      });
    }
  }

  async consultar(saleId: number, empresaId: number) {
    const note = await this.prisma.fiscalNote.findUnique({ where: { saleId } });
    if (!note) return null;

    // Verifica que a venda pertence à empresa
    const sale = await this.prisma.sale.findFirst({ where: { id: saleId, empresaId } });
    if (!sale) return null;

    // Se ainda processando, consulta status na FocusNFE
    if (note.status === 'PROCESSING') {
      const cfg = await this.settings.getAll(empresaId);
      const token = cfg.focusnfe_token;
      if (token) {
        const baseUrl =
          note.ambiente === 'producao'
            ? 'https://api.focusnfe.com.br'
            : 'https://homologacao.focusnfe.com.br';
        try {
          const res = await fetch(`${baseUrl}/v2/nfce/${note.ref}?completa=1`, {
            headers: { Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}` },
          });
          if (res.ok) {
            const data = (await res.json()) as any;
            return this.applyFocusResponse(note.id, data, note.ambiente);
          }
        } catch {}
      }
    }

    return note;
  }

  async cancelar(id: number, empresaId: number, justificativa: string) {
    const note = await this.prisma.fiscalNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Nota fiscal não encontrada');
    if (note.status !== 'AUTHORIZED') {
      throw new BadRequestException('Apenas notas autorizadas podem ser canceladas');
    }

    const cfg = await this.settings.getAll(empresaId);
    const token = cfg.focusnfe_token;
    if (!token) throw new BadRequestException('Token FocusNFE não configurado');

    const baseUrl =
      note.ambiente === 'producao'
        ? 'https://api.focusnfe.com.br'
        : 'https://homologacao.focusnfe.com.br';

    const res = await fetch(`${baseUrl}/v2/nfce/${note.ref}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
      },
      body: JSON.stringify({ justificativa }),
    });

    const data = (await res.json()) as any;

    if (data.status !== 'cancelado') {
      const errMsg = data.mensagem_sefaz || data.mensagem || `Cancelamento rejeitado pela SEFAZ`;
      throw new BadRequestException(errMsg);
    }

    return this.prisma.fiscalNote.update({
      where: { id },
      data: { status: $Enums.FiscalNoteStatus.CANCELLED, errorMessage: null },
    });
  }

  async checkCaixaElegivel(cashRegisterId: number, empresaId: number) {
    const cashRegister = await this.prisma.cashRegister.findFirst({
      where: { id: cashRegisterId, empresaId },
    });
    if (!cashRegister) throw new NotFoundException('Caixa não encontrado');

    const sales = await this.prisma.sale.findMany({
      where: { cashRegisterId, empresaId, status: 'COMPLETED' },
      select: { id: true, finalAmount: true },
    });

    if (sales.length === 0) {
      return { elegivel: false, motivo: 'Nenhuma venda concluída neste caixa', salesCount: 0, totalAmount: 0 };
    }

    const notaExistente = await this.prisma.fiscalNote.findFirst({
      where: {
        status: { in: [$Enums.FiscalNoteStatus.AUTHORIZED, $Enums.FiscalNoteStatus.PROCESSING] },
        OR: [
          { saleId: { in: sales.map((s) => s.id) } },
          { cashRegisterId },
        ],
      },
    });

    return {
      elegivel: !notaExistente,
      motivo: notaExistente ? 'Já existe NFC-e emitida para este caixa' : null,
      salesCount: sales.length,
      totalAmount: sales.reduce((sum, s) => sum + Number(s.finalAmount), 0),
    };
  }

  async emitirCaixa(cashRegisterId: number, empresaId: number, cpfDestinatario?: string) {
    const check = await this.checkCaixaElegivel(cashRegisterId, empresaId);
    if (!check.elegivel) throw new BadRequestException(check.motivo);

    const cfg = await this.settings.getAll(empresaId);
    const token = cfg.focusnfe_token;
    if (!token) throw new BadRequestException('Token FocusNFE não configurado em Configurações > Fiscal');

    const sales = await this.prisma.sale.findMany({
      where: { cashRegisterId, empresaId, status: 'COMPLETED' },
      include: { items: { include: { product: true } }, payments: true },
    });

    const ambiente = cfg.focusnfe_ambiente || 'homologacao';
    const ref = `nfce-caixa-${cashRegisterId}-${Date.now()}`;

    const note = await this.prisma.fiscalNote.create({
      data: { cashRegisterId, ref, cpfDestinatario, status: $Enums.FiscalNoteStatus.PROCESSING, ambiente },
    });

    // Agrupa todos os itens de todas as vendas
    const itemMap = new Map<number, { product: any; quantity: number; unitPrice: number; subtotal: number }>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = itemMap.get(item.productId);
        if (existing) {
          existing.quantity += Number(item.quantity);
          existing.subtotal += Number(item.subtotal);
        } else {
          itemMap.set(item.productId, {
            product: item.product,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
          });
        }
      }
    }

    // Agrupa pagamentos por método
    const paymentMap = new Map<string, number>();
    for (const sale of sales) {
      for (const p of sale.payments) {
        paymentMap.set(p.method, (paymentMap.get(p.method) || 0) + Number(p.amount));
      }
    }

    const fakeSale = {
      items: Array.from(itemMap.values()).map((v) => ({ product: v.product, productId: v.product.id, quantity: v.quantity, unitPrice: v.unitPrice, subtotal: v.subtotal, discount: 0 })),
      payments: Array.from(paymentMap.entries()).map(([method, amount]) => ({ method, amount })),
      discount: 0,
      customer: null,
    };

    const payload = this.buildPayload(fakeSale as any, cfg, cpfDestinatario, ambiente);

    const baseUrl = ambiente === 'producao' ? 'https://api.focusnfe.com.br' : 'https://homologacao.focusnfe.com.br';

    try {
      const res = await fetch(`${baseUrl}/v2/nfce?ref=${ref}&completa=1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as any;

      if (res.status === 200 || res.status === 201) {
        const updated = await this.applyFocusResponse(note.id, data, ambiente);
        if (updated.status === 'AUTHORIZED') {
          const emailContador = await this.settings.get('email_contador', empresaId);
          this.sendXmlToAccountant(updated, emailContador, empresaId);
        }
        return updated;
      }

      const errosDetail = Array.isArray(data?.erros) ? data.erros.map((e: any) => e.mensagem).join('; ') : null;
      const errMsg = errosDetail || data?.mensagem || `HTTP ${res.status}`;

      return this.prisma.fiscalNote.update({
        where: { id: note.id },
        data: { status: $Enums.FiscalNoteStatus.ERROR, errorMessage: errMsg },
      });
    } catch (err: any) {
      return this.prisma.fiscalNote.update({
        where: { id: note.id },
        data: { status: $Enums.FiscalNoteStatus.ERROR, errorMessage: err?.message ?? String(err) },
      });
    }
  }

  async listar(empresaId: number, page = 1, status?: string) {
    const take = 20;
    const skip = (page - 1) * take;
    const where: any = {
      OR: [
        { sale: { empresaId } },
        { cashRegister: { empresaId } },
      ],
    };
    if (status) where.status = status;

    const [notes, total] = await Promise.all([
      this.prisma.fiscalNote.findMany({
        where,
        include: {
          sale: { select: { id: true, finalAmount: true, createdAt: true } },
          cashRegister: {
            select: {
              id: true,
              sales: { where: { status: 'COMPLETED' }, select: { finalAmount: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.fiscalNote.count({ where }),
    ]);

    const data = notes.map((n) => ({
      ...n,
      cashRegisterTotal: n.cashRegister
        ? n.cashRegister.sales.reduce((s, v) => s + Number(v.finalAmount), 0)
        : null,
    }));

    return { data, total, page, totalPages: Math.ceil(total / take) };
  }

  async inutilizar(empresaId: number, dto: { numeroInicial: number; numeroFinal: number; serie?: string; justificativa: string }) {
    const cfg = await this.settings.getAll(empresaId);
    const token = cfg.focusnfe_token;
    if (!token) throw new BadRequestException('Token FocusNFE não configurado');

    const ambiente = cfg.focusnfe_ambiente || 'homologacao';
    const serie = dto.serie || '1';
    const ref = `inut-${Date.now()}`;

    const baseUrl = ambiente === 'producao'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    const res = await fetch(`${baseUrl}/v2/nfce/inutilizacao?ref=${ref}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        cnpj: (cfg.fiscal_cnpj || '').replace(/\D/g, ''),
        serie,
        numero_inicial: dto.numeroInicial,
        numero_final: dto.numeroFinal,
        justificativa: dto.justificativa,
      }),
    });

    const data = (await res.json()) as any;
    if (!res.ok) {
      throw new BadRequestException(data?.mensagem || `Erro ao inutilizar: HTTP ${res.status}`);
    }
    return data;
  }

  async enviarXml(noteId: number, empresaId: number) {
    const note = await this.prisma.fiscalNote.findFirst({
      where: { id: noteId },
      include: {
        sale: { select: { empresaId: true } },
        cashRegister: { select: { empresaId: true } },
      },
    });
    if (!note) throw new NotFoundException('Nota não encontrada');
    const noteEmpresaId = note.sale?.empresaId ?? note.cashRegister?.empresaId;
    if (noteEmpresaId !== empresaId) throw new NotFoundException('Nota não encontrada');
    if (note.status !== 'AUTHORIZED') throw new BadRequestException('Somente notas autorizadas podem ser enviadas');

    const emailContador = await this.settings.get('email_contador', empresaId);
    const destinatarios = emailContador.split(',').map(e => e.trim()).filter(Boolean);
    if (!destinatarios.length) throw new BadRequestException('E-mail do contador não configurado em Configurações');

    await this.sendXmlToAccountant(note as any, emailContador, empresaId);
    return { ok: true, destinatarios };
  }

  private async sendXmlToAccountant(note: any, emailContador: string, empresaId: number) {
    const resendKey = process.env.RESEND_API_KEY;
    const emailRemetente = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const destinatarios = emailContador.split(',').map(e => e.trim()).filter(Boolean);
    if (!resendKey || !destinatarios.length || !note.ref) return;

    const cfg = await this.settings.getAll(empresaId);
    const token = cfg.focusnfe_token;
    if (!token) return;

    const ambiente = cfg.focusnfe_ambiente || 'homologacao';
    const baseUrl = ambiente === 'producao'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';

    try {
      const metaRes = await fetch(`${baseUrl}/v2/nfce/${note.ref}`, {
        headers: { Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}` },
      });
      if (!metaRes.ok) return;
      const meta = (await metaRes.json()) as any;
      const xmlPath = meta.caminho_xml_nota_fiscal;
      if (!xmlPath) return;

      const xmlRes = await fetch(`${baseUrl}${xmlPath}`, {
        headers: { Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}` },
      });
      if (!xmlRes.ok) return;
      const xmlContent = await xmlRes.text();

      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);

      const nfNum = note.numeroNota ? `NFC-e nº ${note.numeroNota}` : `ID ${note.id}`;
      const filename = `nfce-${note.numeroNota ?? note.id}.xml`;

      await resend.emails.send({
        from: emailRemetente,
        to: destinatarios,
        subject: `XML ${nfNum} — Casa Granella`,
        html: `<p>Segue em anexo o XML da ${nfNum} emitida pela Casa Granella.</p>
               <p>Chave de acesso: <code>${note.chaveAcesso ?? '—'}</code></p>`,
        attachments: [{ filename, content: Buffer.from(xmlContent).toString('base64') }],
      });
    } catch {
      // erro de e-mail não impacta o fluxo principal
    }
  }

  private applyFocusResponse(noteId: number, data: any, ambiente?: string) {
    const baseUrl = (ambiente || 'homologacao') === 'producao'
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';
    const danfeUrl = data.caminho_danfe ? `${baseUrl}${data.caminho_danfe}` : null;
    return this.prisma.fiscalNote.update({
      where: { id: noteId },
      data: {
        status: this.mapStatus(data.status),
        chaveAcesso: data.chave_nfe ?? null,
        nsu: data.nsu ?? null,
        numeroNota: data.numero ? Number(data.numero) : null,
        serie: data.serie != null ? String(data.serie) : null,
        danfeUrl,
        qrcodeUrl: data.qrcode_url ?? null,
        errorMessage: data.mensagem_sefaz ?? data.mensagem ?? null,
      },
    });
  }

  private mapStatus(status: string): $Enums.FiscalNoteStatus {
    switch (status) {
      case 'autorizado': return $Enums.FiscalNoteStatus.AUTHORIZED;
      case 'cancelado': return $Enums.FiscalNoteStatus.CANCELLED;
      case 'denegado': return $Enums.FiscalNoteStatus.DENIED;
      case 'processando_autorizacao': return $Enums.FiscalNoteStatus.PROCESSING;
      default: return $Enums.FiscalNoteStatus.ERROR;
    }
  }

  private buildPayload(
    sale: any,
    cfg: Record<string, string>,
    cpfDestinatario: string | undefined,
    ambiente: string,
  ) {
    const pad = (n: number) => String(n).padStart(2, '0');
    const brt = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const dataEmissao =
      `${brt.getUTCFullYear()}-${pad(brt.getUTCMonth() + 1)}-${pad(brt.getUTCDate())}` +
      `T${pad(brt.getUTCHours())}:${pad(brt.getUTCMinutes())}:${pad(brt.getUTCSeconds())}-03:00`;

    const isHomologacao = ambiente !== 'producao';

    const items = sale.items.map((item: any, index: number) => {
      const unit = item.product.unit === 'L' ? 'L' : item.product.unit === 'kg' ? 'KG' : 'UN';
      const qty = Number(item.quantity);
      const price = Number(item.unitPrice);
      const subtotal = Number(item.subtotal);

      return {
        numero_item: index + 1,
        codigo_produto: String(item.productId).padStart(6, '0'),
        descricao: isHomologacao
          ? 'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'
          : item.product.name,
        cfop: '5102',
        unidade_comercial: unit,
        quantidade_comercial: qty,
        valor_unitario_comercial: price,
        valor_bruto: subtotal,
        unidade_tributavel: unit,
        quantidade_tributavel: qty,
        valor_unitario_tributavel: price,
        codigo_ncm: cfg.fiscal_ncm_padrao || '21069090',
        icms_origem: 0,
        icms_situacao_tributaria: cfg.fiscal_csosn || '400',
        pis_situacao_tributaria: '07',
        cofins_situacao_tributaria: '07',
        ...(Number(item.discount) > 0 && { valor_desconto: Number(item.discount) }),
      };
    });

    const forma_pagamento = sale.payments.map((p: any) => ({
      forma_pagamento: PAYMENT_METHOD_MAP[p.method] ?? '99',
      valor_pagamento: Number(p.amount),
    }));

    const payload: Record<string, any> = {
      natureza_operacao: 'VENDA AO CONSUMIDOR',
      data_emissao: dataEmissao,
      tipo_documento: 1,
      modalidade_frete: 9,
      presenca_comprador: 1,
      consumidor_final: 1,
      finalidade_emissao: 1,
      cnpj_emitente: (cfg.fiscal_cnpj || '').replace(/\D/g, ''),
      nome_emitente: cfg.fiscal_razao_social || cfg.store_name,
      nome_fantasia_emitente: cfg.fiscal_nome_fantasia || cfg.store_name,
      logradouro_emitente: cfg.fiscal_logradouro || '',
      numero_emitente: cfg.fiscal_numero || 'S/N',
      bairro_emitente: cfg.fiscal_bairro || '',
      municipio_emitente: cfg.fiscal_municipio || 'Colombo',
      uf_emitente: cfg.fiscal_uf || 'PR',
      cep_emitente: (cfg.fiscal_cep || '').replace(/\D/g, ''),
      telefone_emitente: (cfg.fiscal_telefone || '').replace(/\D/g, ''),
      inscricao_estadual_emitente: (cfg.fiscal_ie || '').replace(/\D/g, '') || 'ISENTO',
      regime_tributario_emitente: Number(cfg.fiscal_regime) || 1,
      items,
      forma_pagamento,
    };

    if (cpfDestinatario) {
      payload.cpf_destinatario = cpfDestinatario.replace(/\D/g, '');
      payload.nome_destinatario = isHomologacao
        ? 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'
        : 'CONSUMIDOR';
    }

    const desconto = Number(sale.discount);
    if (desconto > 0) payload.valor_desconto = desconto;

    return payload;
  }
}
