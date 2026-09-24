// Gerador de payload PIX estático seguindo especificação BCB (Banco Central do Brasil)

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  return ((crc & 0xffff).toString(16).toUpperCase().padStart(4, '0'))
}

function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

export interface PixPayloadOptions {
  pixKey: string
  merchantName: string
  merchantCity: string
  amount?: number
  txid?: string
  description?: string
}

function normalizePixKey(key: string): string {
  const k = key.trim()
  if (/^\+?55?\d{10,11}$/.test(k.replace(/\D/g, ''))) {
    const digits = k.replace(/\D/g, '')
    if (digits.length === 11) return `+55${digits}`
    if (digits.length === 13 && digits.startsWith('55')) return `+${digits}`
  }
  return k
}

export function generatePixPayload(opts: PixPayloadOptions): string {
  const { merchantName, merchantCity, amount, txid, description } = opts
  const pixKey = normalizePixKey(opts.pixKey)

  const gui = field('00', 'BR.GOV.BCB.PIX')
  const key = field('01', pixKey)
  const desc = description ? field('02', description.slice(0, 72)) : ''
  const merchantAccount = field('26', gui + key + desc)

  const txidValue = txid ? txid.replace(/\W/g, '').slice(0, 25) : '***'
  const additionalData = field('62', field('05', txidValue))

  const amountField = amount && amount > 0 ? field('54', amount.toFixed(2)) : ''

  const payload =
    field('00', '01') +
    field('01', '12') +
    merchantAccount +
    field('52', '0000') +
    field('53', '986') +
    amountField +
    field('58', 'BR') +
    field('59', merchantName.slice(0, 25).toUpperCase()) +
    field('60', merchantCity.slice(0, 15).toUpperCase()) +
    additionalData +
    '6304'

  return payload + crc16(payload)
}
