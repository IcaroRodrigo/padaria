import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULTS: Record<string, string> = {
  store_name: '',
  store_city: '',
  pix_key: '',
  pix_key_type: 'cpf',
  pix_merchant_name: '',
  scale_format: 'price',
  scale_plu_digits: '5',
  scale_value_digits: '5',
  // Fiscal / NFC-e
  focusnfe_token: '',
  focusnfe_ambiente: 'homologacao',
  fiscal_cnpj: '',
  fiscal_ie: '',
  fiscal_regime: '1',
  fiscal_razao_social: '',
  fiscal_nome_fantasia: '',
  fiscal_logradouro: '',
  fiscal_numero: '',
  fiscal_bairro: '',
  fiscal_municipio: '',
  fiscal_uf: '',
  fiscal_cep: '',
  fiscal_telefone: '',
  fiscal_ncm_padrao: '21069090',
  fiscal_csosn: '400',
  // E-mail
  email_contador: 'icaro.rodrigo@gmail.com',
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll(empresaId: number): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany({ where: { empresaId } });
    const result = { ...DEFAULTS };
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async get(key: string, empresaId: number): Promise<string> {
    const row = await this.prisma.setting.findUnique({
      where: { empresaId_key: { empresaId, key } },
    });
    return row?.value ?? DEFAULTS[key] ?? '';
  }

  async set(key: string, value: string, empresaId: number): Promise<void> {
    await this.prisma.setting.upsert({
      where: { empresaId_key: { empresaId, key } },
      update: { value },
      create: { key, value, empresaId },
    });
  }

  async setMany(data: Record<string, string>, empresaId: number): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value, empresaId);
    }
    return this.getAll(empresaId);
  }
}
