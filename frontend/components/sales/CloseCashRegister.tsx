'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import QRCode from 'qrcode'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp, FileText, Printer, ExternalLink } from 'lucide-react'
import type { FiscalNote } from '@/types'

interface CashRegister {
  id: number
  openingBalance: string | number
  openedAt: string
  totalSales: number
  salesCount: number
  byMethod: Record<string, number>
}

interface CloseCashRegisterProps {
  cashRegister: CashRegister
  onSuccess: () => void
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro', PIX: 'PIX', DEBIT: 'Débito', CREDIT: 'Crédito', MIXED: 'Misto',
}

function formatCpf(value: string) {
  return value.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function CloseCashRegister({ cashRegister, onSuccess }: CloseCashRegisterProps) {
  const [closingBalance, setClosingBalance] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [closed, setClosed] = useState(false)
  const [cpf, setCpf] = useState('')
  const [nfceResult, setNfceResult] = useState<FiscalNote | null>(null)
  const [printing, setPrinting] = useState(false)

  const openingBalance = Number(cashRegister.openingBalance)
  const cashSales = cashRegister.byMethod?.CASH || 0
  const expectedCash = openingBalance + cashSales
  const counted = parseFloat(closingBalance) || 0
  const difference = counted - expectedCash

  const nonCashMethods = Object.entries(cashRegister.byMethod || {}).filter(
    ([method, amount]) => method !== 'CASH' && amount > 0,
  )

  const { data: checkData } = useQuery({
    queryKey: ['fiscal-caixa-check', cashRegister.id],
    queryFn: () =>
      api.get<{ elegivel: boolean; motivo: string | null; salesCount: number; totalAmount: number }>(
        `/fiscal/caixa/${cashRegister.id}/check`,
      ).then(r => r.data),
    enabled: closed,
  })

  const closeMutation = useMutation({
    mutationFn: () =>
      api.post(`/sales/cash-register/${cashRegister.id}/close`, { closingBalance: counted }),
    onSuccess: () => setClosed(true),
  })

  const nfceMutation = useMutation({
    mutationFn: (cpfValue?: string) =>
      api.post<FiscalNote>(`/fiscal/caixa/${cashRegister.id}/emit`, { cpf: cpfValue || undefined }),
    onSuccess: (res) => setNfceResult(res.data),
  })

  const handlePrintA4 = async () => {
    if (!nfceResult) return
    setPrinting(true)
    try {
      const qrDataUrl = nfceResult.qrcodeUrl
        ? await QRCode.toDataURL(nfceResult.qrcodeUrl, { width: 160, margin: 1 })
        : ''
      const isHomolog = nfceResult.ambiente === 'homologacao'
      const chaveFormatada = nfceResult.chaveAcesso?.replace(/(\d{4})/g, '$1 ').trim() ?? ''

      const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>NFC-e Caixa #${cashRegister.id}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:Arial,sans-serif; font-size:11px; color:#000; padding:16px; max-width:400px; margin:auto; }
h1 { font-size:15px; text-align:center; } .sub { text-align:center; font-size:10px; color:#444; }
.badge { background:#f59e0b; color:#000; font-weight:bold; font-size:10px; padding:2px 8px; border-radius:4px; display:inline-block; }
hr { border:none; border-top:1px dashed #999; margin:8px 0; }
table { width:100%; border-collapse:collapse; } th { font-size:10px; border-bottom:1px solid #ccc; padding-bottom:3px; }
td { padding:2px 0; } .right { text-align:right; }
.bold { font-weight:bold; font-size:13px; }
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
<p><strong>NFC-e nº ${nfceResult.numeroNota ?? '—'}</strong> · Série ${nfceResult.serie ?? '1'}</p>
<p>Nota geral — Caixa #${cashRegister.id}</p>
<p>Emissão: ${new Date(nfceResult.createdAt).toLocaleString('pt-BR')}</p>
<hr>
<p style="font-size:9px;text-align:center;margin-bottom:4px">DANFE NFC-e — Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
<p class="chave">${chaveFormatada}</p>
${qrDataUrl ? `<div class="qr-block"><img src="${qrDataUrl}" alt="QR Code NFC-e"><br><span style="font-size:9px">Consulte em nfce.fazenda.pr.gov.br</span></div>` : ''}
<p class="footer">Casa Granella · Obrigado pela preferência!</p>
</body></html>`

      const win = window.open('', '_blank', 'width=480,height=720')
      if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
    } finally {
      setPrinting(false)
    }
  }

  const openedAt = new Date(cashRegister.openedAt)
  const duration = Math.floor((Date.now() - openedAt.getTime()) / 1000 / 60)
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  // ── Pós-fechamento: tela de NFC-e ──────────────────────────────────────────
  if (closed) {
    if (nfceResult) {
      return (
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-border p-6 space-y-4">
          <div className="flex flex-col items-center gap-3 py-2">
            {nfceResult.status === 'AUTHORIZED' ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-success" />
                <div className="text-center">
                  <p className="font-semibold text-success">Nota autorizada!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    NFC-e nº {nfceResult.numeroNota} · Série {nfceResult.serie}
                  </p>
                </div>
                {nfceResult.chaveAcesso && (
                  <div className="w-full bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Chave de acesso</p>
                    <p className="text-xs font-mono break-all leading-relaxed">{nfceResult.chaveAcesso}</p>
                  </div>
                )}
                <div className="flex flex-col gap-2 w-full">
                  <Button onClick={handlePrintA4} disabled={printing} loading={printing} className="w-full gap-2">
                    <Printer size={15} />
                    Imprimir NFC-e (A4)
                  </Button>
                  {nfceResult.danfeUrl && (
                    <a href={nfceResult.danfeUrl} target="_blank" rel="noreferrer"
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
                {nfceResult.errorMessage && (
                  <p className="text-xs text-muted-foreground text-center bg-red-50 rounded-lg p-3 w-full">
                    {nfceResult.errorMessage}
                  </p>
                )}
              </>
            )}
          </div>
          <Button variant="outline" onClick={onSuccess} className="w-full">Concluir</Button>
        </div>
      )
    }

    return (
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-border p-6 space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckCircle2 className="w-12 h-12 text-success" />
          <h2 className="text-lg font-bold">Caixa fechado!</h2>
          <p className="text-sm text-muted-foreground">Caixa #{cashRegister.id} encerrado com sucesso.</p>
        </div>

        {checkData?.elegivel ? (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-primary" />
                <span className="text-sm font-semibold">Emitir Nota Geral do Caixa</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {checkData.salesCount} venda{checkData.salesCount !== 1 ? 's' : ''} · {formatCurrency(checkData.totalAmount)} total
              </p>
              <p className="text-xs text-muted-foreground">
                Nenhuma NFC-e foi emitida individualmente — você pode emitir uma nota consolidando todas as vendas do dia.
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
                disabled={nfceMutation.isPending}
              />
            </div>

            {nfceMutation.isError && (
              <p className="text-xs text-destructive">
                {(nfceMutation.error as any)?.response?.data?.message || 'Erro ao emitir nota'}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => nfceMutation.mutate(cpf.replace(/\D/g, '') || undefined)}
                loading={nfceMutation.isPending}
                className="w-full gap-2"
              >
                <FileText size={15} />
                Emitir Nota Geral
              </Button>
              <Button variant="outline" onClick={onSuccess} className="w-full" disabled={nfceMutation.isPending}>
                Pular — não emitir nota
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {checkData && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">{checkData.motivo ?? 'Nota geral não disponível para este caixa.'}</p>
              </div>
            )}
            <Button onClick={onSuccess} className="w-full">Concluir</Button>
          </div>
        )}
      </div>
    )
  }

  // ── Tela de fechamento ──────────────────────────────────────────────────────
  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-border p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold">Fechar Caixa #{cashRegister.id}</h2>
        <p className="text-sm text-muted-foreground">
          Aberto há {hours > 0 ? `${hours}h ` : ''}{minutes}min · {cashRegister.salesCount} venda{cashRegister.salesCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-primary" />
          <span className="text-sm font-semibold">Resumo de vendas</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Saldo de abertura</span>
          <span className="money">{formatCurrency(openingBalance)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total em vendas</span>
          <span className="money font-medium text-primary">{formatCurrency(cashRegister.totalSales)}</span>
        </div>
        <div className="border-t border-border pt-2 mt-2 space-y-1.5">
          {cashSales > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>↳ Dinheiro</span>
              <span className="money">{formatCurrency(cashSales)}</span>
            </div>
          )}
          {nonCashMethods.map(([method, amount]) => (
            <div key={method} className="flex justify-between text-xs text-muted-foreground">
              <span>↳ {METHOD_LABELS[method] || method}</span>
              <span className="money">{formatCurrency(amount)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Dinheiro esperado em caixa</span>
          <span className="money font-semibold">{formatCurrency(expectedCash)}</span>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Valor contado no caixa (R$)</label>
          <input
            type="number" min="0" step="0.01" value={closingBalance}
            onChange={(e) => setClosingBalance(e.target.value)}
            placeholder={formatCurrency(expectedCash)}
            className="w-full px-3 py-2.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {closingBalance !== '' && counted > 0 && (
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
            difference === 0 ? 'bg-green-50 border border-green-200 text-green-800'
            : difference > 0 ? 'bg-blue-50 border border-blue-200 text-blue-800'
            : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {difference === 0 ? <CheckCircle2 size={16} /> : difference > 0 ? <AlertTriangle size={16} /> : <XCircle size={16} />}
              <span>{difference === 0 ? 'Caixa conferido!' : difference > 0 ? 'Sobra de caixa' : 'Falta de caixa'}</span>
            </div>
            <span className="money">{difference !== 0 && (difference > 0 ? '+' : '')}{formatCurrency(difference)}</span>
          </div>
        )}
      </div>

      {!confirmed ? (
        <Button onClick={() => setConfirmed(true)} disabled={!closingBalance} className="w-full" variant="destructive">
          Fechar caixa
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-center text-muted-foreground">
            Tem certeza? O caixa será fechado e um novo deverá ser aberto para continuar vendendo.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmed(false)}>Cancelar</Button>
            <Button className="flex-1" variant="destructive" loading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
              Confirmar fechamento
            </Button>
          </div>
        </div>
      )}

      {closeMutation.isError && (
        <p className="text-destructive text-xs text-center">
          {(closeMutation.error as any)?.response?.data?.message || 'Erro ao fechar caixa'}
        </p>
      )}
    </div>
  )
}
