'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, X, Clock } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { AssinaturaModal } from '@/components/assinatura/AssinaturaModal'
import api from '@/lib/api'

type EmpresaStatus = 'TRIAL' | 'ATIVA' | 'EXPIRADA' | 'BLOQUEADA'

interface EmpresaStatusData {
  nome: string
  status: EmpresaStatus
  diasRestantes?: number
}

function getBannerStyle(status: EmpresaStatus, diasRestantes?: number) {
  if (status === 'EXPIRADA') {
    return {
      className: 'bg-red-600 text-white',
      message: 'Seu período de acesso expirou. Assine para continuar usando o sistema.',
    }
  }
  if (status === 'TRIAL') {
    if (diasRestantes != null && diasRestantes <= 3) {
      return {
        className: 'bg-red-600 text-white',
        message: `Crítico: ${diasRestantes} dia${diasRestantes === 1 ? '' : 's'} restante${diasRestantes === 1 ? '' : 's'} no trial. Assine agora!`,
      }
    }
    if (diasRestantes != null && diasRestantes <= 7) {
      return {
        className: 'bg-orange-500 text-white',
        message: `Atenção: ${diasRestantes} dias restantes no trial.`,
      }
    }
    return {
      className: 'bg-[#4a7c2f] text-white',
      message: `Trial ativo: ${diasRestantes ?? '?'} dias restantes.`,
    }
  }
  return null
}

export function TrialBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [pendente, setPendente] = useState(false)
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data } = useQuery<EmpresaStatusData>({
    queryKey: ['empresa', 'status'],
    queryFn: () => api.get('/empresa/status').then((r) => r.data),
    enabled: isAuthenticated && user?.role !== 'SUPER_ADMIN',
  })

  if (!isAuthenticated || user?.role === 'SUPER_ADMIN') return null
  if (!data) return null
  if (data.status === 'ATIVA' || data.status === 'BLOQUEADA') return null

  // Card "em processamento" — após enviar comprovante via WhatsApp
  if (pendente) {
    return (
      <div className="w-full px-4 py-2.5 flex items-center justify-between gap-4 text-sm bg-blue-600 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-4 h-4 shrink-0 animate-pulse" />
          <span className="truncate">
            Pagamento enviado — aguardando confirmação. Confirmaremos em até 24 h via WhatsApp.
          </span>
        </div>
      </div>
    )
  }

  if (dismissed) return null

  const config = getBannerStyle(data.status, data.diasRestantes)
  if (!config) return null

  return (
    <>
      <div className={`w-full px-4 py-2.5 flex items-center justify-between gap-4 text-sm ${config.className}`}>
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="truncate">{config.message}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition border border-white/30"
          >
            Assinar agora
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition"
            aria-label="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showModal && (
        <AssinaturaModal
          nomeEmpresa={data.nome}
          emailEmpresa={user?.email ?? ''}
          onClose={() => setShowModal(false)}
          onSent={() => {
            setShowModal(false)
            setPendente(true)
          }}
        />
      )}
    </>
  )
}
