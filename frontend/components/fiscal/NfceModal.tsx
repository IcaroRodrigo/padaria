'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import QRCode from 'qrcode'
import api from '@/lib/api'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, FileText, ExternalLink, Loader2, Printer } from 'lucide-react'
import type { FiscalNote } from '@/types'

interface NfceModalProps {
  open: boolean
  onClose: () => void
  saleId: number
  sale?: any
}

function formatCpf(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function NfceModal({ open, onClose, saleId, sale }: NfceModalProps) {
  const [cpf, setCpf] = useState('')
  const [result, setResult] = useState<FiscalNote | null>(null)
  const [printing, setPrinting] = useState(false)

  const mutation = useMutation({
    mutationFn: (cpfValue?: string) =>
      api.post<FiscalNote>(`/fiscal/emit/${saleId}`, { cpf: cpfValue || undefined }),
    onSuccess: (res) => setResult(res.data),
  })

  const handleEmit = (withCpf: boolean) => {
    const cpfClean = cpf.replace(/\D/g, '')
    if (withCpf && cpfClean.length !== 11) return
    mutation.mutate(withCpf ? cpfClean : undefined)
  }

  const handleClose = () => {
    setCpf('')
    setResult(null)
    mutation.reset()
    onClose()
  }

  const handlePrintThermal = async () => {
    if (!result || !sale) return
    setPrinting(true)
    try {
      await fetch('http://localhost:9100/print-nfce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sale,
          chaveAcesso: result.chaveAcesso,
          qrcodeUrl: result.qrcodeUrl,
          danfeUrl: result.danfeUrl,
          numeroNota: result.numeroNota,
          serie: result.serie,
          cpfDestinatario: result.cpfDestinatario,
          ambiente: result.ambiente,
        }),
      })
    } catch {
      alert('Agente de impressão não encontrado. Verifique se o agente está rodando.')
    } finally {
      setPrinting(false)
    }
  }

  const handlePrintA4 = async () => {
    if (!result || !sale) return
    setPrinting(true)
    try {
      const qrDataUrl = result.qrcodeUrl
        ? await QRCode.toDataURL(result.qrcodeUrl, { width: 160, margin: 1 })
        : ''

      const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
      const now = new Date().toLocaleString('pt-BR')
      const isHomolog = result.ambiente === 'homologacao'
      const chaveFormatada = result.chaveAcesso
        ? result.chaveAcesso.replace(/(\d{4})/g, '$1 ').trim()
        : ''

      const methodLabels: Record<string, string> = {
        CASH: 'Dinheiro', CREDIT: 'Cartão Crédito',
        DEBIT: 'Cartão Débito', PIX: 'PIX', MIXED: 'Misto',
      }

      const itemsHtml = (sale.items ?? []).map((item: any) => {
        const name = item.product?.name ?? item.name ?? ''
        const qty = Number(item.quantity)
        const unit = item.product?.unit ?? item.unit ?? ''
        const price = Number(item.unitPrice)
        const sub = Number(item.subtotal)
        return `
          <tr>
            <td>${name}</td>
            <td class="center">${qty.toFixed(3)} ${unit}</td>
            <td class="right">${fmt(price)}</td>
            <td class="right">${fmt(sub)}</td>
          </tr>`
      }).join('')

      const paymentsHtml = (sale.payments ?? []).map((p: any) => `
        <tr>
          <td>${methodLabels[p.method] ?? p.method}</td>
          <td class="right">${fmt(Number(p.amount))}</td>
        </tr>`).join('')

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>NFC-e nº ${result.numeroNota ?? ''}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 16px; max-width: 400px; margin: auto; }
  h1 { font-size: 15px; text-align: center; margin-bottom: 2px; }
  .sub { text-align: center; font-size: 10px; color: #444; margin-bottom: 4px; }
  .badge { text-align: center; background: #f59e0b; color: #000; font-weight: bold; font-size: 10px; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px; }
  hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 10px; text-align: left; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
  td { padding: 2px 0; vertical-align: top; }
  .center { text-align: center; }
  .right { text-align: right; }
  .total-row td { font-weight: bold; font-size: 13px; padding-top: 4px; }
  .chave { font-size: 9px; font-family: monospace; word-break: break-all; background: #f5f5f5; padding: 6px; border-radius: 4px; }
  .qr-block { text-align: center; margin: 10px 0; }
  .qr-block img { width: 140px; height: 140px; }
  .footer { text-align: center; font-size: 9px; color: #555; margin-top: 4px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <h1>CASA GRANELLA</h1>
  <p class="sub">Produtos Naturais · Colombo/PR</p>
  ${isHomolog ? '<p style="text-align:center"><span class="badge">HOMOLOGAÇÃO — SEM VALOR FISCAL</span></p>' : ''}
  <hr>
  <p><strong>NFC-e nº ${result.numeroNota ?? '—'}</strong> · Série ${result.serie ?? '1'}</p>
  <p>Emissão: ${now}</p>
  ${result.cpfDestinatario ? `<p>CPF: ${result.cpfDestinatario}</p>` : ''}
  <hr>
  <table>
    <thead><tr>
      <th>Produto</th><th class="center">Qtd</th><th class="right">Unit.</th><th class="right">Total</th>
    </tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <hr>
  <table>
    <tbody>
      ${Number(sale.discount) > 0 ? `<tr><td>Subtotal</td><td class="right">${fmt(Number(sale.totalAmount))}</td></tr><tr><td>Desconto</td><td class="right">- ${fmt(Number(sale.discount))}</td></tr>` : ''}
      <tr class="total-row"><td>TOTAL</td><td class="right">${fmt(Number(sale.finalAmount))}</td></tr>
      ${paymentsHtml}
      ${Number(sale.change) > 0 ? `<tr><td>Troco</td><td class="right">${fmt(Number(sale.change))}</td></tr>` : ''}
    </tbody>
  </table>
  <hr>
  <p style="font-size:9px;margin-bottom:4px;text-align:center">DANFE NFC-e — Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
  <p class="chave">${chaveFormatada}</p>
  ${qrDataUrl ? `<div class="qr-block"><img src="${qrDataUrl}" alt="QR Code NFC-e"><br><span style="font-size:9px">Consulte em nfce.fazenda.pr.gov.br</span></div>` : ''}
  <p class="footer">Obrigado pela preferência! · Casa Granella</p>
</body>
</html>`

      const win = window.open('', '_blank', 'width=480,height=720')
      if (win) {
        win.document.write(html)
        win.document.close()
        win.onload = () => win.print()
      }
    } finally {
      setPrinting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Emitir NFC-e" size="sm">
      {result ? (
        <div className="space-y-4">
          {result.status === 'AUTHORIZED' && (
            <div className="flex flex-col items-center gap-3 py-2">
              <CheckCircle2 className="w-12 h-12 text-success" />
              <div className="text-center">
                <p className="font-semibold text-success">Nota autorizada!</p>
                {result.numeroNota && (
                  <p className="text-sm text-muted-foreground mt-1">
                    NFC-e nº {result.numeroNota} · Série {result.serie}
                  </p>
                )}
              </div>
              {result.chaveAcesso && (
                <div className="w-full bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Chave de acesso</p>
                  <p className="text-xs font-mono break-all leading-relaxed">{result.chaveAcesso}</p>
                </div>
              )}
              {result.danfeUrl && (
                <a
                  href={result.danfeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink size={14} />
                  Abrir DANFE no navegador
                </a>
              )}
              {sale && (
                <div className="flex flex-col gap-2 w-full">
                  <Button
                    onClick={handlePrintA4}
                    disabled={printing}
                    loading={printing}
                    className="w-full gap-2"
                  >
                    <Printer size={15} />
                    Imprimir NFC-e (A4 / PDF)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePrintThermal}
                    disabled={printing}
                    loading={printing}
                    className="w-full gap-2"
                  >
                    <Printer size={15} />
                    Imprimir NFC-e (Térmica)
                  </Button>
                </div>
              )}
            </div>
          )}

          {result.status === 'PROCESSING' && (
            <div className="flex flex-col items-center gap-3 py-2">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground text-center">
                Nota em processamento na SEFAZ. Aguarde alguns instantes.
              </p>
            </div>
          )}

          {(result.status === 'ERROR' || result.status === 'DENIED') && (
            <div className="flex flex-col items-center gap-3 py-2">
              <XCircle className="w-10 h-10 text-destructive" />
              <p className="font-semibold text-destructive text-center">
                {result.status === 'DENIED' ? 'Nota denegada' : 'Erro na emissão'}
              </p>
              {result.errorMessage && (
                <p className="text-xs text-muted-foreground text-center bg-red-50 rounded-lg p-3 w-full">
                  {result.errorMessage}
                </p>
              )}
            </div>
          )}

          <Button variant="outline" onClick={handleClose} className="w-full">
            Fechar
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Informe o CPF do consumidor para incluir na nota, ou emita sem identificação.
          </p>

          <Input
            label="CPF do consumidor (opcional)"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            disabled={mutation.isPending}
          />

          {mutation.isError && (
            <p className="text-xs text-destructive">
              {(mutation.error as any)?.response?.data?.message || 'Erro ao emitir nota fiscal'}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleEmit(true)}
              disabled={cpf.replace(/\D/g, '').length !== 11}
              loading={mutation.isPending}
              className="w-full flex items-center gap-2"
            >
              <FileText size={15} />
              Emitir com CPF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleEmit(false)}
              loading={mutation.isPending}
              className="w-full"
            >
              Emitir sem CPF
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="w-full text-muted-foreground"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
