// Leitor de etiquetas de balança
// Suporta EAN-13 começando com "2" (padrão Toledo/Filizola/Urano)
//
// Formato mais comum no Brasil (Toledo Prix):
//   2 PPPPP VVVVV C  (13 dígitos)
//   2 = prefixo produto pesado
//   PPPPP = PLU do produto (5 dígitos)
//   VVVVV = valor em centavos OU peso em gramas (5 dígitos)
//   C = dígito verificador EAN
//
// Exemplo: 2000010046503
//   PLU = 00001, Valor = 00465 → R$ 4,65

export type ScaleFormat = 'price' | 'weight'

export interface ScaleBarcodeResult {
  isScaleBarcode: boolean
  plu?: number
  /** Preço total em R$ (quando format=price) */
  price?: number
  /** Peso em kg (quando format=weight) */
  weight?: number
  raw: string
}

export interface ScaleConfig {
  format: ScaleFormat
  pluDigits: number   // normalmente 5
  valueDigits: number // normalmente 5
}

const DEFAULT_CONFIG: ScaleConfig = {
  format: 'price',
  pluDigits: 5,
  valueDigits: 5,
}

export function parseScaleBarcode(
  barcode: string,
  config: Partial<ScaleConfig> = {},
): ScaleBarcodeResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const raw = barcode.trim()

  // Deve ser EAN-13 (13 dígitos) começando com "2"
  if (!/^\d{13}$/.test(raw) || raw[0] !== '2') {
    return { isScaleBarcode: false, raw }
  }

  // Extrai PLU e valor
  const pluStart = 1
  const pluEnd = 1 + cfg.pluDigits
  const valueEnd = pluEnd + cfg.valueDigits

  const pluStr = raw.slice(pluStart, pluEnd)
  const valueStr = raw.slice(pluEnd, valueEnd)

  const plu = parseInt(pluStr, 10)
  const rawValue = parseInt(valueStr, 10)

  if (isNaN(plu) || plu === 0 || isNaN(rawValue)) {
    return { isScaleBarcode: false, raw }
  }

  if (cfg.format === 'price') {
    return {
      isScaleBarcode: true,
      plu,
      price: rawValue / 100, // centavos → reais
      raw,
    }
  } else {
    return {
      isScaleBarcode: true,
      plu,
      weight: rawValue / 1000, // gramas → kg
      raw,
    }
  }
}

export function settingsToScaleConfig(settings: Record<string, string>): ScaleConfig {
  return {
    format: (settings.scale_format as ScaleFormat) || 'price',
    pluDigits: parseInt(settings.scale_plu_digits || '5', 10),
    valueDigits: parseInt(settings.scale_value_digits || '5', 10),
  }
}
