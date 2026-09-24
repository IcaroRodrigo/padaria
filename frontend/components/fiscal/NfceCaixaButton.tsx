'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import QRCode from 'qrcode'
import api from '@/lib/api'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle2, XCircle, Printer, ExternalLink, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { FiscalNote } from '@/types'

function formatCpf(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function NfceCaixaButton({ cashRegisterId }: { cashRegisterId: number }) {
  const [open, setOpen] = useState(false)
  const [cpf, setCpf] = useState('')
  const [result, setResult] = useState<FiscalNote | null>(null)
  const [printing, setPrinting] = useState(false)

  const { data: check, isLoading: checkLoading } = useQuery({
    queryKey: ['fiscal-caixa-check', cashRegisterId],
    queryFn: () =>
      api.get<{ elegivel: boolean; motivo: string | null; salesCount: number; totalAmount: number }>(
        `/fiscal/caixa/${cashRegisterId}/check`,
      ).then(r => r.data),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (cpfValue?: string) =>
      api.post<FiscalNote>(`/fiscal/caixa/${cashRegisterId}/emit`, { cpf: cpfValue || undefined }),
    onSuccess: (res) => setResult(res.data),
  })

  const handleClose = () => {
    setOpen(false)
    setCpf('')
    setResult(null)
    mutation.reset()
  }

  const handlePrintA4 = async () => {
    if (!result) return
    setPrinting(true)
    try {
      const qrDataUrl = result.qrcodeUrl
        ? await QRCode.toDataURL(result.qrcodeUrl, { width: 160, margin: 1 })
        : ''
      const isHomolog = result.ambiente === 'homologacao'
      const chaveFormatada = result.chaveAcesso?.replace(/(\d{4})/g, '$1 ').trim() ?? ''

      const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>NFC-e Caixa #${cashRegisterId}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:Arial,sans-serif; font-size:11px; color:#000; padding:16px; max-width:400px; margin:auto; }
h1 { font-size:15px; text-align:center; } .sub { text-align:center; font-size:10px; color:#444; }
.badge { background:#f59e0b; color:#000; font-weight:bold; font-size:10px; padding:2px 8px; border-radius:4px; display:inline-block; }
hr { border:none; border-top:1px dashed #999; margin:8px 0; }
.chave { font-size:9px; font-family:monospace; word-break:break-all; background:#f5f5f5; padding:6px; border-radius:4px; }
.qr-block { text-align:center; margin:10px 0; } .qr-block img { width:140px; height:140px; }
.footer { text-align:center; font-size:9px; color:#555; margin-top:4px; }
@media print { body { padding:0; } }
</style></head>
<body>
<h1>CASA GRANELLA</h1>
<p class="sub">Produtos Naturais · Colombo/PR</p>
${isHomolog ? '<p style="text-align:center;margin-top:4px"><span class="badge">HOMOLOGAÇÃO — SEM VALOR FISCAL</span></p>' : ''}
<hr>
<p><strong>NFC-e nº ${result.numeroNota ?? '—'}</strong> · Série ${result.serie ?? '1'}</p>
<p>Nota geral — Caixa #${cashRegisterId}</p>
<p>Emissão: ${new Date(result.createdAt).toLocaleString('pt-BR')}</p>
<hr>
<p style="font-size:9px;text-align:center;margin-bottom:4px">DANFE NFC-e — Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
<p class="chave">${chaveFormatada}</p>
${qrDataUrl ? `<div class="qr-block"><img src="${qrDataUrl}" alt="QR Code"><br><span style="font-size:9px">Consulte em nfce.fazenda.pr.gov.br</span></div>` : ''}
<p class="footer">Casa Granella · Obrigado pela preferência!</p>
</body></html>`

      const win = window.open('', '_blank', 'width=480,height=720')
      if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
    } finally {
      setPrinting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        title="Emitir NFC-e do caixa"
      >
        <FileText size={15} />
      </button>

      <Modal open={open} onClose={handleClose} title={`NFC-e — Caixa #${cashRegisterId}`} size="sm">
        {result ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-2">
              {result.status === 'AUTHORIZED' ? (
                <>
                  <CheckCircle2 className="w-12 h-12 text-success" />
                  <div className="text-center">
                    <p className="font-semibold text-success">Nota autorizada!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      NFC-e nº {result.numeroNota} · Série {result.serie}
                    </p>
                  </div>
                  {result.chaveAcesso && (
                    <div className="w-full bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Chave de acesso</p>
                      <p className="text-xs font-mono break-all leading-relaxed">{result.chaveAcesso}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 w-full">
                    <Button onClick={handlePrintA4} disabled={printing} loading={printing} className="w-full gap-2">
                      <Printer size={15} /> Imprimir NFC-e (A4)
                    </Button>
                    {result.danfeUrl && (
                      <a href={result.danfeUrl} target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                        <ExternalLink size={14} /> Abrir DANFE no navegador
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-10 h-10 text-destructive" />
                  <p className="font-semibold text-destructive">Erro na emissão</p>
                  {result.errorMessage && (
                    <p className="text-xs text-muted-foreground text-center bg-red-50 rounded-lg p-3 w-full">
                      {result.errorMessage}
                    </p>
                  )}
                </>
              )}
            </div>
            <Button variant="outline" onClick={handleClose} className="w-full">Fechar</Button>
          </div>
        ) : checkLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : check?.elegivel ? (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold">Emitir nota geral do caixa</p>
              <p className="text-xs text-muted-foreground">
                {check.salesCount} venda{check.salesCount !== 1 ? 's' : ''} · {formatCurrency(check.totalAmount)} total
              </p>
              <p className="text-xs text-muted-foreground">
                Nenhuma NFC-e foi emitida individualmente para este caixa.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">CPF do consumidor (opcional)</label>
              <input
                type="text"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={mutation.isPending}
              />
            </div>

            {mutation.isError && (
              <p className="text-xs text-destructive">
                {(mutation.error as any)?.response?.data?.message || 'Erro ao emitir nota'}
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
              <Button
                onClick={() => mutation.mutate(cpf.replace(/\D/g, '') || undefined)}
                loading={mutation.isPending}
                className="flex-1 gap-2"
              >
                <FileText size={15} /> Emitir Nota
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              {check?.motivo ?? 'Este caixa não é elegível para nota geral.'}
            </div>
            <Button variant="outline" onClick={handleClose} className="w-full">Fechar</Button>
          </div>
        )}
      </Modal>
    </>
  )
}
