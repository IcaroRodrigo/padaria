'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Users, Clock, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react'
import api from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type EmpresaStatus = 'TRIAL' | 'ATIVA' | 'EXPIRADA' | 'BLOQUEADA'

interface Empresa {
  id: number
  nome: string
  email: string
  status: EmpresaStatus
  diasRestantes?: number
  criadaEm: string
  _count: { users: number }
}

interface Solicitacao {
  id: number
  comprovanteUrl?: string
  valorPago?: number
  criadoEm: string
  empresa: { id: number; nome: string; email: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<EmpresaStatus, { label: string; className: string }> = {
  TRIAL: {
    label: 'Trial',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  },
  ATIVA: {
    label: 'Ativa',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  EXPIRADA: {
    label: 'Expirada',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
  BLOQUEADA: {
    label: 'Bloqueada',
    className: 'bg-gray-100 text-gray-700 border border-gray-200',
  },
}

function StatusBadge({ status }: { status: EmpresaStatus }) {
  const cfg = statusConfig[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<{ id: number; type: 'success' | 'error'; msg: string } | null>(null)

  // Queries
  const { data: empresas = [], isLoading: loadingEmpresas } = useQuery<Empresa[]>({
    queryKey: ['admin', 'empresas'],
    queryFn: () => api.get('/admin/empresas').then((r) => r.data),
  })

  const { data: solicitacoes = [], isLoading: loadingSolicits } = useQuery<Solicitacao[]>({
    queryKey: ['admin', 'solicitacoes'],
    queryFn: () => api.get('/admin/empresas/solicitacoes').then((r) => r.data),
  })

  // Mutations
  const aprovar = useMutation({
    mutationFn: (id: number) => api.post(`/admin/empresas/solicitacoes/${id}/aprovar`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      setFeedback({ id, type: 'success', msg: 'Solicitação aprovada.' })
    },
    onError: (_, id) => {
      setFeedback({ id, type: 'error', msg: 'Erro ao aprovar.' })
    },
  })

  const rejeitar = useMutation({
    mutationFn: (id: number) => api.post(`/admin/empresas/solicitacoes/${id}/rejeitar`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      setFeedback({ id, type: 'success', msg: 'Solicitação rejeitada.' })
    },
    onError: (_, id) => {
      setFeedback({ id, type: 'error', msg: 'Erro ao rejeitar.' })
    },
  })

  // Summary counts
  const total = empresas.length
  const emTrial = empresas.filter((e) => e.status === 'TRIAL').length
  const ativas = empresas.filter((e) => e.status === 'ATIVA').length
  const problematicas = empresas.filter((e) => e.status === 'EXPIRADA' || e.status === 'BLOQUEADA').length

  const summaryCards = [
    { label: 'Total de empresas', value: total, icon: Building2, color: 'bg-blue-50 text-blue-700' },
    { label: 'Em trial', value: emTrial, icon: Clock, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Ativas', value: ativas, icon: CheckCircle, color: 'bg-green-50 text-green-700' },
    { label: 'Expiradas / Bloqueadas', value: problematicas, icon: AlertTriangle, color: 'bg-red-50 text-red-700' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral do sistema GranelSystem</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Solicitações pendentes */}
      {(loadingSolicits || solicitacoes.length > 0) && (
        <div className="bg-white rounded-xl border border-yellow-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-yellow-100 bg-yellow-50 flex items-center gap-2">
            <Users className="w-4 h-4 text-yellow-700" />
            <h2 className="font-semibold text-yellow-800 text-sm">
              Solicitações pendentes
              {!loadingSolicits && (
                <span className="ml-2 bg-yellow-200 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-medium">
                  {solicitacoes.length}
                </span>
              )}
            </h2>
          </div>

          {loadingSolicits ? (
            <div className="p-6 text-center text-gray-400 text-sm">Carregando...</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {solicitacoes.map((s) => (
                <div key={s.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.empresa.nome}</p>
                    <p className="text-xs text-gray-500">
                      {s.empresa.email} · Criado em {formatDate(s.criadoEm)}
                      {s.valorPago != null && ` · R$ ${Number(s.valorPago).toFixed(2)}`}
                    </p>
                    {s.comprovanteUrl && (
                      <a href={s.comprovanteUrl} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-600 underline">
                        Ver comprovante
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {feedback?.id === s.id && (
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          feedback.type === 'success'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {feedback.msg}
                      </span>
                    )}
                    <button
                      onClick={() => aprovar.mutate(s.id)}
                      disabled={aprovar.isPending || rejeitar.isPending}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => rejeitar.mutate(s.id)}
                      disabled={aprovar.isPending || rejeitar.isPending}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empresas table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-800 text-sm">Todas as empresas</h2>
        </div>

        {loadingEmpresas ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : empresas.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhuma empresa cadastrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Dias restantes</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Criada em</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {empresas.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5 font-medium text-gray-900">{e.nome}</td>
                    <td className="px-6 py-3.5 text-gray-600">{e.email}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {e.diasRestantes != null ? `${e.diasRestantes} dias` : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">{formatDate(e.criadaEm)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <a
                        href={`/admin/empresas/${e.id}`}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
