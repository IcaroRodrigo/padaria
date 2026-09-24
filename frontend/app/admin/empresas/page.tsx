'use client'

import { useCallback, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Users, CheckCircle, XCircle, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

type EmpresaStatus = 'TRIAL' | 'ATIVA' | 'EXPIRADA' | 'BLOQUEADA'

interface Empresa {
  id: number
  nome: string
  email: string
  cnpj?: string
  telefone?: string
  ativo: boolean
  status: EmpresaStatus
  diasRestantes: number
  criadaEm: string
  _count: { users: number }
}

const statusCfg: Record<EmpresaStatus, string> = {
  TRIAL:    'bg-amber-100 text-amber-800',
  ATIVA:    'bg-green-100 text-green-800',
  EXPIRADA: 'bg-red-100 text-red-800',
  BLOQUEADA:'bg-gray-100 text-gray-600',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function AdminEmpresasPage() {
  const qc = useQueryClient()
  const [feedback, setFeedback] = useState<{ id: number; msg: string; ok: boolean } | null>(null)

  const { data: empresas = [], isLoading } = useQuery<Empresa[]>({
    queryKey: ['admin', 'empresas'],
    queryFn: () => api.get('/admin/empresas').then(r => r.data),
  })

  const toggleAtivo = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      api.patch(`/admin/empresas/${id}/status`, { ativo }),
    onSuccess: (_, { id, ativo }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'empresas'] })
      setFeedback({ id, msg: ativo ? 'Empresa ativada.' : 'Empresa bloqueada.', ok: ativo })
      setTimeout(() => setFeedback(null), 3000)
    },
  })

  const stats = {
    total: empresas.length,
    ativas: empresas.filter(e => e.status === 'ATIVA').length,
    trial: empresas.filter(e => e.status === 'TRIAL').length,
    bloqueadas: empresas.filter(e => !e.ativo).length,
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie as empresas cadastradas no sistema</p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['admin', 'empresas'] })}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-700' },
          { label: 'Ativas', value: stats.ativas, color: 'text-green-600' },
          { label: 'Trial', value: stats.trial, color: 'text-amber-600' },
          { label: 'Bloqueadas', value: stats.bloqueadas, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-800 text-sm">Todas as empresas</h2>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Empresa</th>
                  <th className="text-left px-6 py-3 hidden md:table-cell">E-mail</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-right px-6 py-3 hidden sm:table-cell">Dias rest.</th>
                  <th className="text-center px-6 py-3 hidden md:table-cell">Usuários</th>
                  <th className="text-left px-6 py-3 hidden lg:table-cell">Criada em</th>
                  <th className="text-center px-6 py-3">Ativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {empresas.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-gray-900">{e.nome}</p>
                      {e.cnpj && <p className="text-xs text-gray-400">{e.cnpj}</p>}
                      {feedback?.id === e.id && (
                        <span className={`text-xs font-medium ${feedback.ok ? 'text-green-600' : 'text-red-600'}`}>
                          {feedback.msg}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 hidden md:table-cell">{e.email}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg[e.status]}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-600 hidden sm:table-cell">
                      {e.diasRestantes > 9999 ? '∞' : e.diasRestantes}
                    </td>
                    <td className="px-6 py-3.5 text-center hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Users className="w-3.5 h-3.5" />
                        {e._count.users}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 hidden lg:table-cell">{fmt(e.criadaEm)}</td>
                    <td className="px-6 py-3.5 text-center">
                      <button
                        onClick={() => toggleAtivo.mutate({ id: e.id, ativo: !e.ativo })}
                        disabled={toggleAtivo.isPending}
                        title={e.ativo ? 'Bloquear empresa' : 'Ativar empresa'}
                        className="p-1 rounded transition hover:bg-gray-100 disabled:opacity-40"
                      >
                        {e.ativo
                          ? <ToggleRight className="w-6 h-6 text-green-600" />
                          : <ToggleLeft className="w-6 h-6 text-gray-400" />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {empresas.length === 0 && (
              <div className="p-10 text-center text-gray-400">Nenhuma empresa cadastrada.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
