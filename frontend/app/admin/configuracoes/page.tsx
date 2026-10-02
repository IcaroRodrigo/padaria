'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Key, MessageCircle, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import api from '@/lib/api'
import { PasswordCriteria, senhaValida } from '@/components/ui/PasswordCriteria'

interface SystemConfig {
  saas_pix_key: string
  saas_whatsapp: string
  saas_valor: string
  saas_pix_name: string
  saas_pix_city: string
}

type FeedbackState = { ok: boolean; msg: string } | null

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c2f]/40 focus:border-[#4a7c2f]"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c2f]/40 focus:border-[#4a7c2f]"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function Feedback({ state }: { state: FeedbackState }) {
  if (!state) return null
  return (
    <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
      state.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
    }`}>
      {state.ok
        ? <CheckCircle className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />
      }
      {state.msg}
    </div>
  )
}

export default function AdminConfiguracoesPage() {
  const qc = useQueryClient()
  const [pixFeedback, setPixFeedback] = useState<FeedbackState>(null)
  const [senhaFeedback, setSenhaFeedback] = useState<FeedbackState>(null)

  // ── PIX / WhatsApp config ─────────────────────────────────────────────────
  const [pixKey, setPixKey] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [valor, setValor] = useState('90')
  const [pixName, setPixName] = useState('COMECA BEM PADARIA')
  const [pixCity, setPixCity] = useState('CURITIBA')

  const { data: config, isLoading } = useQuery<SystemConfig>({
    queryKey: ['admin', 'system-config'],
    queryFn: () => api.get('/admin/empresas/config').then(r => r.data),
  })

  useEffect(() => {
    if (!config) return
    setPixKey(config.saas_pix_key ?? '')
    setWhatsapp(config.saas_whatsapp ?? '')
    setValor(config.saas_valor ?? '90')
    setPixName(config.saas_pix_name ?? 'COMECA BEM PADARIA')
    setPixCity(config.saas_pix_city ?? 'CURITIBA')
  }, [config])

  const salvarPix = useMutation({
    mutationFn: () => api.patch('/admin/empresas/config', {
      saas_pix_key: pixKey.trim(),
      saas_whatsapp: whatsapp.replace(/\D/g, ''),
      saas_valor: valor,
      saas_pix_name: pixName.trim().toUpperCase(),
      saas_pix_city: pixCity.trim().toUpperCase(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'system-config'] })
      qc.invalidateQueries({ queryKey: ['empresa', 'assinatura-info'] })
      setPixFeedback({ ok: true, msg: 'Configurações salvas com sucesso.' })
      setTimeout(() => setPixFeedback(null), 4000)
    },
    onError: () => {
      setPixFeedback({ ok: false, msg: 'Erro ao salvar. Tente novamente.' })
    },
  })

  // ── Troca de senha ────────────────────────────────────────────────────────
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmSenha, setConfirmSenha] = useState('')

  const trocarSenha = useMutation({
    mutationFn: () => api.patch('/auth/change-password', { senhaAtual, novaSenha }),
    onSuccess: () => {
      setSenhaAtual(''); setNovaSenha(''); setConfirmSenha('')
      setSenhaFeedback({ ok: true, msg: 'Senha alterada com sucesso.' })
      setTimeout(() => setSenhaFeedback(null), 4000)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Erro ao alterar senha.'
      setSenhaFeedback({ ok: false, msg })
      setTimeout(() => setSenhaFeedback(null), 5000)
    },
  })

  const handleTrocarSenha = () => {
    if (!senhaAtual || !novaSenha) {
      setSenhaFeedback({ ok: false, msg: 'Preencha todos os campos.' })
      return
    }
    if (!senhaValida(novaSenha)) {
      setSenhaFeedback({ ok: false, msg: 'A nova senha não atende todos os critérios de segurança.' })
      return
    }
    if (novaSenha !== confirmSenha) {
      setSenhaFeedback({ ok: false, msg: 'A nova senha e a confirmação não coincidem.' })
      return
    }
    trocarSenha.mutate()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500 mt-0.5">Dados de pagamento e segurança da conta</p>
        </div>
      </div>

      {/* ── Seção PIX ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
            <Key className="w-4 h-4 text-green-700" />
          </div>
          <h2 className="font-semibold text-gray-800">Dados de pagamento (PIX)</h2>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400">Carregando…</p>
        ) : (
          <div className="space-y-4">
            <Field
              label="Chave PIX"
              value={pixKey}
              onChange={setPixKey}
              placeholder="+5541999999999 ou email@exemplo.com"
              hint="Telefone com +55, e-mail, CPF ou CNPJ (sem pontuação)"
            />

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Valor da mensalidade (R$)"
                value={valor}
                onChange={setValor}
                placeholder="90"
                hint="Somente o número, sem centavos"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp para comprovantes
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="5541999999999"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a7c2f]/40 focus:border-[#4a7c2f]"
                />
                <p className="text-xs text-gray-400 mt-1">Somente dígitos, com DDI e DDD</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Nome do recebedor (PIX)"
                value={pixName}
                onChange={setPixName}
                placeholder="COMECA BEM PADARIA"
                hint="Máx. 25 caracteres, sem acentos"
              />
              <Field
                label="Cidade (PIX)"
                value={pixCity}
                onChange={setPixCity}
                placeholder="CURITIBA"
                hint="Máx. 15 caracteres, sem acentos"
              />
            </div>

            <Feedback state={pixFeedback} />

            <div className="flex justify-end pt-1">
              <button
                onClick={() => salvarPix.mutate()}
                disabled={salvarPix.isPending}
                className="bg-[#4a7c2f] hover:bg-[#3d6827] text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {salvarPix.isPending ? 'Salvando…' : 'Salvar configurações'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Seção Senha ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-blue-700" />
          </div>
          <h2 className="font-semibold text-gray-800">Alterar senha</h2>
        </div>

        <div className="space-y-4">
          <PasswordField
            label="Senha atual"
            value={senhaAtual}
            onChange={setSenhaAtual}
          />
          <div>
            <PasswordField
              label="Nova senha"
              value={novaSenha}
              onChange={setNovaSenha}
              placeholder="Mínimo 8 caracteres"
            />
            <PasswordCriteria senha={novaSenha} />
          </div>
          <PasswordField
            label="Confirmar nova senha"
            value={confirmSenha}
            onChange={setConfirmSenha}
          />

          <Feedback state={senhaFeedback} />

          <div className="flex justify-end pt-1">
            <button
              onClick={handleTrocarSenha}
              disabled={trocarSenha.isPending}
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {trocarSenha.isPending ? 'Alterando…' : 'Alterar senha'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
