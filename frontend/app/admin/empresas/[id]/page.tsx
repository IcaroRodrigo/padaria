'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Building2, Mail, Phone, Hash,
  Users, ShoppingCart, Package, CheckCircle, XCircle,
  ToggleLeft, ToggleRight, Clock,
} from 'lucide-react'
import api from '@/lib/api'

type EmpresaStatus = 'TRIAL' | 'ATIVA' | 'EXPIRADA' | 'BLOQUEADA'

interface EmpresaDetail {
  id: number
  nome: string
  email: string
  cnpj?: string
  telefone?: string
  ativo: boolean
  trialExpiraEm: string
  assinaturaExpiraEm?: string
  criadaEm: string
  status: EmpresaStatus
  diasRestantes: number
  users: { id: number; name: string; email: string; role: string; active: boolean }[]
  solicitacoes: {
    id: number; status: string; valorPago?: number
    comprovanteUrl?: string; criadoEm: string; processadoEm?: string
  }[]
  _count: { sales: number; products: number }
}

const statusCfg: Record<EmpresaStatus, { label: string; cls: string }> = {
  TRIAL:    { label: 'Trial',    cls: 'bg-amber-100 text-amber-800' },
  ATIVA:    { label: 'Ativa',   cls: 'bg-green-100 text-green-800' },
  EXPIRADA: { label: 'Expirada',cls: 'bg-red-100 text-red-800' },
  BLOQUEADA:{ label: 'Bloqueada',cls:'bg-gray-100 text-gray-600' },
}

function fmt(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function EmpresaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: empresa, isLoading } = useQuery<EmpresaDetail>({
    queryKey: ['admin', 'empresa', id],
    queryFn: () => api.get(`/admin/empresas/${id}`).then(r => r.data),
  })

  const toggleAtivo = useMutation({
    mutationFn: (ativo: boolean) => api.patch(`/admin/empresas/${id}/status`, { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'empresa', id] }),
  })

  const aprovar = useMutation({
    mutationFn: (solId: number) => api.post(`/admin/empresas/solicitacoes/${solId}/aprovar`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'empresa', id] })
      qc.invalidateQueries({ queryKey: ['admin', 'solicitacoes'] })
    },
  })

  const rejeitar = useMutation({
    mutationFn: (solId: number) => api.post(`/admin/empresas/solicitacoes/${solId}/rejeitar`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'empresa', id] })
      qc.invalidateQueries({ queryKey: ['admin', 'solicitacoes'] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Carregando...
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Empresa não encontrada.
      </div>
    )
  }

  const cfg = statusCfg[empresa.status]
  const pendentes = empresa.solicitacoes.filter(s => s.status === 'PENDENTE')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <button
        onClick={() => router.push('/admin/empresas')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{empresa.nome}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
              {cfg.label}
            </span>
            {empresa.diasRestantes <= 9999 && (
              <span className="text-xs text-gray-500">{empresa.diasRestantes} dias restantes</span>
            )}
          </div>
        </div>
        <button
          onClick={() => toggleAtivo.mutate(!empresa.ativo)}
          disabled={toggleAtivo.isPending}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition disabled:opacity-50 ${
            empresa.ativo
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-green-200 text-green-600 hover:bg-green-50'
          }`}
        >
          {empresa.ativo
            ? <><ToggleRight className="w-4 h-4" /> Bloquear</>
            : <><ToggleLeft className="w-4 h-4" /> Ativar</>
          }
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">

          {/* Solicitações pendentes */}
          {pendentes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <h2 className="font-semibold text-amber-900 text-sm">
                  {pendentes.length} solicitação{pendentes.length > 1 ? 'ões' : ''} pendente{pendentes.length > 1 ? 's' : ''}
                </h2>
              </div>
              {pendentes.map(sol => (
                <div key={sol.id} className="bg-white rounded-lg border border-amber-200 p-4 mb-3 last:mb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {sol.valorPago != null && (
                        <p className="text-sm font-medium text-green-700 mb-1">
                          Valor pago: R$ {Number(sol.valorPago).toFixed(2)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Enviado em {fmt(sol.criadoEm)}</p>
                      {sol.comprovanteUrl && (
                        <a
                          href={sol.comprovanteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 underline mt-1 inline-block"
                        >
                          Ver comprovante →
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { if (confirm('Aprovar? Acesso estendido por 30 dias.')) aprovar.mutate(sol.id) }}
                        disabled={aprovar.isPending}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => { if (confirm('Rejeitar esta solicitação?')) rejeitar.mutate(sol.id) }}
                        disabled={rejeitar.isPending}
                        className="flex items-center gap-1 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Usuários */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <h2 className="font-semibold text-gray-800 text-sm">Usuários ({empresa.users.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Nome</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">E-mail</th>
                  <th className="text-left px-5 py-3">Perfil</th>
                  <th className="text-center px-5 py-3">Ativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {empresa.users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {u.active
                        ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Histórico de assinaturas */}
          {empresa.solicitacoes.filter(s => s.status !== 'PENDENTE').length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800 text-sm">Histórico de assinaturas</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {empresa.solicitacoes.filter(s => s.status !== 'PENDENTE').map(sol => (
                  <div key={sol.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">{fmt(sol.criadoEm)}</p>
                      {sol.valorPago != null && (
                        <p className="text-sm text-gray-700">R$ {Number(sol.valorPago).toFixed(2)}</p>
                      )}
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sol.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {sol.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 text-sm">Estatísticas</h2>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{empresa._count.sales}</p>
                <p className="text-xs text-gray-500">Vendas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{empresa._count.products}</p>
                <p className="text-xs text-gray-500">Produtos</p>
              </div>
            </div>
          </div>

          {/* Dados cadastrais */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="font-semibold text-gray-800 text-sm">Dados cadastrais</h2>
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="text-gray-700">{empresa.nome}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span className="text-gray-700 break-all">{empresa.email}</span>
            </div>
            {empresa.cnpj && (
              <div className="flex items-start gap-2 text-sm">
                <Hash className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700">{empresa.cnpj}</span>
              </div>
            )}
            {empresa.telefone && (
              <div className="flex items-start gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-gray-700">{empresa.telefone}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-100 space-y-1 text-xs text-gray-500">
              <p>Criada em: {fmt(empresa.criadaEm)}</p>
              <p>Trial expira: {fmt(empresa.trialExpiraEm)}</p>
              {empresa.assinaturaExpiraEm && (
                <p>Assinatura até: {fmt(empresa.assinaturaExpiraEm)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
