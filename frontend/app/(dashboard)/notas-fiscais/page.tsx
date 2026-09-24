'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import {
  FileText, XCircle, Ban, Printer, ExternalLink,
  ChevronLeft, ChevronRight, AlertTriangle, Mail,
} from 'lucide-react'
import type { FiscalNote } from '@/types'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  AUTHORIZED: { label: 'Autorizada', color: 'text-success bg-green-50 border-green-200' },
  CANCELLED:  { label: 'Cancelada',  color: 'text-orange-600 bg-orange-50 border-orange-200' },
  DENIED:     { label: 'Denegada',   color: 'text-destructive bg-red-50 border-red-200' },
  ERROR:      { label: 'Erro',       color: 'text-destructive bg-red-50 border-red-200' },
  PROCESSING: { label: 'Processando', color: 'text-blue-600 bg-blue-50 border-blue-200' },
}

type NoteWithSale = FiscalNote & {
  sale: { id: number; finalAmount: number; createdAt: string } | null
  cashRegister: { id: number } | null
  cashRegisterTotal: number | null
}

function fmt(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}` }
function fmtDate(d: string) { return new Date(d).toLocaleString('pt-BR') }
function chaveFormatada(c?: string | null) {
  if (!c) return '—'
  return c.replace(/(\d{4})/g, '$1 ').trim()
}

export default function NotasFiscaisPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelNote, setCancelNote] = useState<NoteWithSale | null>(null)
  const [justificativa, setJustificativa] = useState('')
  const [showInutilizar, setShowInutilizar] = useState(false)
  const [inut, setInut] = useState({ numeroInicial: '', numeroFinal: '', serie: '1', justificativa: '' })
  const [printing, setPrinting] = useState<number | null>(null)
  const [sendingXml, setSendingXml] = useState<number | null>(null)
  const [xmlSentId, setXmlSentId] = useState<number | null>(null)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 4000)
  }

  const { data, isLoading } = useQuery({
    queryKey: ['fiscal-notes', page, statusFilter],
    queryFn: () =>
      api.get<{ data: NoteWithSale[]; total: number; totalPages: number }>(
        `/fiscal?page=${page}${statusFilter ? `&status=${statusFilter}` : ''}`,
      ).then(r => r.data),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, just }: { id: number; just: string }) =>
      api.delete(`/fiscal/${id}/cancel`, { data: { justificativa: just } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fiscal-notes'] })
      setCancelNote(null)
      setJustificativa('')
    },
  })

  const inutMutation = useMutation({
    mutationFn: (body: typeof inut) =>
      api.post('/fiscal/inutilizar', {
        numeroInicial: Number(body.numeroInicial),
        numeroFinal: Number(body.numeroFinal),
        serie: body.serie,
        justificativa: body.justificativa,
      }),
    onSuccess: () => {
      setShowInutilizar(false)
      setInut({ numeroInicial: '', numeroFinal: '', serie: '1', justificativa: '' })
    },
  })

  const handlePrintA4 = async (note: NoteWithSale) => {
    setPrinting(note.id)
    try {
      const qrDataUrl = note.qrcodeUrl
        ? await QRCode.toDataURL(note.qrcodeUrl, { width: 160, margin: 1 })
        : ''
      const isHomolog = note.ambiente === 'homologacao'

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>NFC-e nº ${note.numeroNota ?? ''}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:Arial,sans-serif; font-size:11px; color:#000; padding:16px; max-width:400px; margin:auto; }
h1 { font-size:15px; text-align:center; margin-bottom:2px; }
.sub { text-align:center; font-size:10px; color:#444; margin-bottom:4px; }
.badge { text-align:center; background:#f59e0b; color:#000; font-weight:bold; font-size:10px; padding:2px 8px; border-radius:4px; display:inline-block; margin-bottom:8px; }
hr { border:none; border-top:1px dashed #999; margin:8px 0; }
table { width:100%; border-collapse:collapse; }
th { font-size:10px; text-align:left; border-bottom:1px solid #ccc; padding-bottom:3px; }
td { padding:2px 0; vertical-align:top; }
.right { text-align:right; } .center { text-align:center; }
.total-row td { font-weight:bold; font-size:13px; padding-top:4px; }
.chave { font-size:9px; font-family:monospace; word-break:break-all; background:#f5f5f5; padding:6px; border-radius:4px; }
.qr-block { text-align:center; margin:10px 0; }
.qr-block img { width:140px; height:140px; }
.footer { text-align:center; font-size:9px; color:#555; margin-top:4px; }
@media print { body { padding:0; } }
</style></head>
<body>
<h1>CASA GRANELLA</h1>
<p class="sub">Produtos Naturais · Colombo/PR</p>
${isHomolog ? '<p style="text-align:center"><span class="badge">HOMOLOGAÇÃO — SEM VALOR FISCAL</span></p>' : ''}
<hr>
<p><strong>NFC-e nº ${note.numeroNota ?? '—'}</strong> · Série ${note.serie ?? '1'}</p>
<p>Emissão: ${fmtDate(note.createdAt)}</p>
${note.sale ? `<p>Venda #${note.sale.id} · ${fmt(Number(note.sale.finalAmount))}</p>` : note.cashRegister ? `<p>Nota geral — Caixa #${note.cashRegister.id}</p>` : ''}
${note.cpfDestinatario ? `<p>CPF: ${note.cpfDestinatario}</p>` : ''}
<hr>
<p style="font-size:9px;margin-bottom:4px;text-align:center">DANFE NFC-e — Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</p>
<p class="chave">${chaveFormatada(note.chaveAcesso)}</p>
${qrDataUrl ? `<div class="qr-block"><img src="${qrDataUrl}" alt="QR Code NFC-e"><br><span style="font-size:9px">Consulte em nfce.fazenda.pr.gov.br</span></div>` : ''}
<p class="footer">Casa Granella · Obrigado pela preferência!</p>
</body></html>`

      const win = window.open('', '_blank', 'width=480,height=720')
      if (win) { win.document.write(html); win.document.close(); win.onload = () => win.print() }
    } finally {
      setPrinting(null)
    }
  }

  const handleSendXml = async (note: NoteWithSale) => {
    setSendingXml(note.id)
    setXmlSentId(null)
    try {
      const res = await api.post<{ destinatarios: string[] }>(`/fiscal/${note.id}/send-xml`)
      const dest = res.data.destinatarios?.join(', ') ?? ''
      setXmlSentId(note.id)
      setTimeout(() => setXmlSentId(null), 4000)
      showNotification('success', `XML enviado para ${dest}`)
    } catch (e: any) {
      showNotification('error', e?.response?.data?.message || 'Erro ao enviar XML por e-mail')
    } finally {
      setSendingXml(null)
    }
  }

  const notes = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="p-6 space-y-5">
      {/* Notificação */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
          notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success'
            ? <Mail size={16} className="shrink-0" />
            : <AlertTriangle size={16} className="shrink-0" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notas Fiscais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.total ?? 0} nota{(data?.total ?? 0) !== 1 ? 's' : ''} emitida{(data?.total ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowInutilizar(true)}
          className="gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
        >
          <Ban size={16} />
          Inutilizar Numeração
        </Button>
      </div>

      {/* Filtro de status */}
      <div className="flex gap-2 flex-wrap">
        {['', 'AUTHORIZED', 'CANCELLED', 'ERROR', 'DENIED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {s === '' ? 'Todas' : STATUS_LABEL[s]?.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">NFC-e</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Venda</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Carregando...</td></tr>
            ) : notes.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Nenhuma nota fiscal encontrada</td></tr>
            ) : notes.map((note) => {
              const st = STATUS_LABEL[note.status] ?? { label: note.status, color: 'text-gray-500 bg-gray-50 border-gray-200' }
              return (
                <tr key={note.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-sm">
                      {note.numeroNota ? `Nº ${note.numeroNota}` : '—'}
                      {note.serie && <span className="text-muted-foreground font-normal"> · Série {note.serie}</span>}
                    </div>
                    {note.cpfDestinatario && (
                      <div className="text-xs text-muted-foreground">CPF: {note.cpfDestinatario}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {note.sale ? `#${note.sale.id}` : note.cashRegister ? `Caixa #${note.cashRegister.id}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{fmtDate(note.createdAt)}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {note.sale
                      ? fmt(Number(note.sale.finalAmount))
                      : note.cashRegisterTotal != null
                        ? fmt(note.cashRegisterTotal)
                        : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${st.color}`}>
                      {st.label}
                    </span>
                    {note.errorMessage && (
                      <p className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={note.errorMessage}>
                        {note.errorMessage}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {note.danfeUrl && (
                        <a href={note.danfeUrl} target="_blank" rel="noreferrer"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                          title="Abrir DANFE">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      {note.status === 'AUTHORIZED' && (
                        <>
                          <button
                            onClick={() => handlePrintA4(note)}
                            disabled={printing === note.id}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                            title="Imprimir NFC-e (A4)">
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => handleSendXml(note)}
                            disabled={sendingXml === note.id}
                            className={`p-1.5 rounded-lg transition-colors ${xmlSentId === note.id ? 'text-success bg-green-50' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
                            title={xmlSentId === note.id ? 'XML enviado!' : 'Enviar XML por e-mail'}>
                            <Mail size={15} />
                          </button>
                          <button
                            onClick={() => { setCancelNote(note); setJustificativa('') }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                            title="Cancelar nota">
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Modal: Cancelar */}
      <Modal open={!!cancelNote} onClose={() => setCancelNote(null)} title="Cancelar NFC-e" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Atenção</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                O cancelamento é irreversível e só é permitido até 30 minutos após a emissão.
              </p>
            </div>
          </div>
          {cancelNote && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p>NFC-e nº {cancelNote.numeroNota} · Série {cancelNote.serie}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {cancelNote.sale ? `Venda #${cancelNote.sale.id}` : cancelNote.cashRegister ? `Caixa #${cancelNote.cashRegister.id}` : ''}
              </p>
            </div>
          )}
          <Input
            label="Justificativa (mín. 15 caracteres)"
            placeholder="Motivo do cancelamento..."
            value={justificativa}
            onChange={e => setJustificativa(e.target.value)}
          />
          {cancelMutation.isError && (
            <p className="text-xs text-destructive">
              {(cancelMutation.error as any)?.response?.data?.message || 'Erro ao cancelar'}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCancelNote(null)} className="flex-1">Voltar</Button>
            <Button
              onClick={() => cancelNote && cancelMutation.mutate({ id: cancelNote.id, just: justificativa })}
              disabled={justificativa.length < 15}
              loading={cancelMutation.isPending}
              className="flex-1 bg-destructive hover:bg-destructive/90"
            >
              Cancelar Nota
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Inutilizar */}
      <Modal open={showInutilizar} onClose={() => setShowInutilizar(false)} title="Inutilizar Numeração" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
            <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Use apenas quando houver lacunas na numeração (números que nunca foram emitidos). Não use para cancelar notas já emitidas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nº Inicial" type="number" min={1} value={inut.numeroInicial}
              onChange={e => setInut(p => ({ ...p, numeroInicial: e.target.value }))} />
            <Input label="Nº Final" type="number" min={1} value={inut.numeroFinal}
              onChange={e => setInut(p => ({ ...p, numeroFinal: e.target.value }))} />
          </div>
          <Input label="Série" value={inut.serie}
            onChange={e => setInut(p => ({ ...p, serie: e.target.value }))} />
          <Input label="Justificativa (mín. 15 caracteres)" placeholder="Motivo da inutilização..."
            value={inut.justificativa}
            onChange={e => setInut(p => ({ ...p, justificativa: e.target.value }))} />
          {inutMutation.isError && (
            <p className="text-xs text-destructive">
              {(inutMutation.error as any)?.response?.data?.message || 'Erro ao inutilizar'}
            </p>
          )}
          {inutMutation.isSuccess && (
            <p className="text-xs text-success">Inutilização registrada com sucesso!</p>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowInutilizar(false)} className="flex-1">Cancelar</Button>
            <Button
              onClick={() => inutMutation.mutate(inut)}
              disabled={!inut.numeroInicial || !inut.numeroFinal || inut.justificativa.length < 15}
              loading={inutMutation.isPending}
              className="flex-1"
            >
              Inutilizar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
