'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface Solicitacao {
  id: number
  comprovanteUrl?: string
  valorPago?: number
  criadoEm: string
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO'
  empresa: { id: number; nome: string; email: string }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminAssinaturasPage() {
  const qc = useQueryClient()
  const [processing, setProcessing] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<{ id: number; msg: string; ok: boolean } | null>(null)

  const { data: solicitacoes = [], isLoading } = useQuery<Solicitacao[]>({
    queryKey: ['admin', 'solicitacoes'],
    queryFn: () => api.get('/admin/empresas/solicitacoes').then(r => r.data),
  })

  const aprovar = useMutation({
    mutationFn: (id: number) => api.post(`/admin/empresas/solicitacoes/${id}/aprovar`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['admin'] })
      setFeedback({ id, msg: 'Assinatura aprovada — acesso estendido por 30 dias.', ok: true })
      setProcessing(null)
      setTimeout(() => setFeedback(null), 5000)
    },
    onError: (_, id) => {
      setFeedback({ id, msg: 'Erro ao aprovar.', ok: false })
      setProcessing(null)
    },
  })

  const rejeitar = useMutation({
    mutationFn: (id: number) => api.post(`/admin/empresas/solicitacoes/${id}/rejeitar`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['admin'] })
      setFeedback({ id, msg: 'Solicitação rejeitada.', ok: false })
      setProcessing(null)
      setTimeout(() => setFeedback(null), 5000)
    },
    onError: (_, id) => {
      setFeedback({ id, msg: 'Erro ao rejeitar.', ok: false })
      setProcessing(null)
    },
  })

  const handleAprovar = (id: number) => {
    if (!confirm('Aprovar esta assinatura? O acesso será estendido por 30 dias.')) return
    setProcessing(id)
    aprovar.mutate(id)
  }

  const handleRejeitar = (id: number) => {
    if (!confirm('Rejeitar esta solicitação?')) return
    setProcessing(id)
    rejeitar.mutate(id)
  }

  const pendentes = solicitacoes.filter(s => s.status === 'PENDENTE')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinaturas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Solicitações de assinatura via PIX aguardando aprovação</p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['admin', 'solicitacoes'] })}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Badge pendentes */}
      {pendentes.length > 0 && (
        <div className="flex items-center gap-2 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-800 font-medium">
            {pendentes.length} solicitação{pendentes.length > 1 ? 'ões' : ''} aguardando aprovação
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
          Carregando...
        </div>
      ) : solicitacoes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhuma solicitação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitacoes.map(s => (
            <div
              key={s.id}
              className={`bg-white rounded-xl border p-5 ${
                s.status === 'PENDENTE' ? 'border-amber-200' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{s.empresa.nome}</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === 'PENDENTE'  ? 'bg-amber-100 text-amber-800' :
                      s.status === 'APROVADO'  ? 'bg-green-100 text-green-800' :
                                                  'bg-red-100 text-red-700'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{s.empresa.email}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    {s.valorPago != null && (
                      <span className="text-green-700 font-medium">
                        Valor pago: R$ {Number(s.valorPago).toFixed(2)}
                      </span>
                    )}
                    <span className="text-gray-400">Enviado em {fmt(s.criadoEm)}</span>
                  </div>

                  {s.comprovanteUrl && (
                    <a
                      href={s.comprovanteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-2 text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      Ver comprovante →
                    </a>
                  )}

                  {feedback?.id === s.id && (
                    <p className={`mt-2 text-sm font-medium ${feedback.ok ? 'text-green-700' : 'text-red-600'}`}>
                      {feedback.msg}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {s.status === 'PENDENTE' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAprovar(s.id)}
                      disabled={processing === s.id}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleRejeitar(s.id)}
                      disabled={processing === s.id}
                      className="flex items-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Rejeitar
                    </button>
                  </div>
                )}

                {s.status !== 'PENDENTE' && (
                  <div className={`shrink-0 flex items-center gap-1.5 text-sm font-medium ${
                    s.status === 'APROVADO' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {s.status === 'APROVADO'
                      ? <><CheckCircle className="w-4 h-4" /> Aprovado</>
                      : <><XCircle className="w-4 h-4" /> Rejeitado</>
                    }
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
